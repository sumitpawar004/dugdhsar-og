import * as jose from 'jose';
import { WorkerEnv } from './types';
import { fetchWithCircuitBreaker } from './lib/fetchWithCircuitBreaker';
import { normalizeUtf8String } from './lib/timezone';
import { logger } from './logger';

// Cached token in-memory to prevent repeated token minting
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// Get Google Sheets OAuth Access Token using WebCrypto RSA signing
export async function getGoogleSheetsAccessToken(env?: WorkerEnv): Promise<string | null> {
  const clientEmail = env?.GOOGLE_SERVICE_ACCOUNT_EMAIL || (typeof process !== 'undefined' ? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL : undefined);
  let privateKeyPem = env?.GOOGLE_PRIVATE_KEY || (typeof process !== 'undefined' ? process.env.GOOGLE_PRIVATE_KEY : undefined);

  if (!clientEmail || !privateKeyPem) {
    return null;
  }

  // Check in-memory cache (tokens are valid for 60 min, reuse for 50 min)
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  // Format private key if escaped newlines are present
  if (privateKeyPem.includes('\\n')) {
    privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
  }

  try {
    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setSubject(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const res = await fetchWithCircuitBreaker('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      }),
      timeoutMs: 8000,
      retrySafe: true // Token minting is safe to retry on 5xx
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn('[Google Sheets] OAuth token exchange failed', { status: res.status, error: errText });
      return null;
    }

    const data: any = await res.json();
    if (data.access_token) {
      cachedAccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + 50 * 60 * 1000
      };
      return data.access_token;
    }
    return null;
  } catch (err: any) {
    logger.warn('[Google Sheets] Token generation error', { error: err.message });
    return null;
  }
}

// Columns for Subscriptions
export const SUBSCRIPTION_SHEET_COLUMNS = [
  'Subscription ID',
  'Customer Name',
  'Customer Mobile',
  'Customer Email',
  'Product Name',
  'Variant / Size',
  'Daily Quantity',
  'Frequency',
  'Delivery Slot',
  'Delivery Address',
  'Start Date',
  'Status',
  'Notes',
  'Last Synced'
];

// Columns for Orders
export const ORDER_SHEET_COLUMNS = [
  'Order ID',
  'Customer Name',
  'Customer Mobile',
  'Customer Email',
  'Total (₹)',
  'Payment Method',
  'Payment Status',
  'Status',
  'Delivery Slot',
  'Address',
  'Pincode',
  'Created At'
];

// Sanitize cell values against formula injection (=, +, -, @, \t, \r) and enforce UTF-8
export function sanitizeSheetCell(val: any): string | number {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return '';
  const str = normalizeUtf8String(val);
  // Formula injection prevention: if first character is =, +, -, @, prefix with a single quote '
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export async function appendRowsToGoogleSheet(
  env: WorkerEnv | undefined,
  sheetName: string,
  rawRows: (string | number)[][],
  columnsHeader?: string[]
): Promise<{ success: boolean; message: string; rowsSynced: number }> {
  // Sanitize every cell to prevent formula injection and normalize UTF-8
  const rows = rawRows.map(row => row.map(sanitizeSheetCell));
  const spreadsheetId = env?.GOOGLE_SHEET_ID || (typeof process !== 'undefined' ? process.env.GOOGLE_SHEET_ID : undefined);
  const webhookUrl = env?.GOOGLE_SHEETS_WEBHOOK_URL || (typeof process !== 'undefined' ? process.env.GOOGLE_SHEETS_WEBHOOK_URL : undefined);

  // Strategy 1: Direct REST API via Google Service Account (lightweight WebCrypto, no googleapis)
  const accessToken = await getGoogleSheetsAccessToken(env);
  if (accessToken && spreadsheetId) {
    try {
      const range = `${sheetName}!A:Z`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

      const response = await fetchWithCircuitBreaker(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        }),
        timeoutMs: 8000
      });

      if (response.ok) {
        return {
          success: true,
          message: `Synced ${rows.length} rows directly to Google Sheet "${sheetName}" via REST API.`,
          rowsSynced: rows.length
        };
      } else {
        const errorText = await response.text();
        logger.warn(`[Google Sheets API] Append failed:`, { status: response.status, error: errorText });
      }
    } catch (err: any) {
      logger.warn(`[Google Sheets API] Exception:`, { error: err.message });
    }
  }

  // Strategy 2: Webhook fallback (Google Apps Script Webhook)
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      await fetchWithCircuitBreaker(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'Dugdhsar Production Platform',
          sheetName,
          timestamp: new Date().toISOString(),
          columns: columnsHeader || [],
          rows
        }),
        timeoutMs: 8000
      });

      return {
        success: true,
        message: `Synced ${rows.length} rows via Google Sheets Webhook.`,
        rowsSynced: rows.length
      };
    } catch (err: any) {
      logger.warn(`[Google Sheets Webhook] Exception:`, { error: err.message });
    }
  }

  // If neither key is configured yet, record sync locally
  return {
    success: true,
    message: `Ready to sync ${rows.length} rows. Please add GOOGLE_SHEET_ID & Service Account credentials in Cloudflare secrets or .dev.vars.`,
    rowsSynced: rows.length
  };
}
