import { WorkerEnv, InstagramFeedResponse, InstagramMediaItem, InstagramProfile } from './types';
import { kvGet, kvGetJSON, kvPut, kvPutJSON } from './kv';
import { fetchWithCircuitBreaker } from './lib/fetchWithCircuitBreaker';
import { logger } from './logger';

const KV_KEY_IG_FEED_CACHE = 'ig_feed_cache';
const KV_KEY_IG_TOKEN = 'ig_token';
const KV_KEY_IG_STALE = 'ig_feed_stale';
const KV_KEY_IG_USER_ID = 'ig_user_id';
const KV_KEY_IG_DIAG = 'ig_diag_status';

const CACHE_TTL_SECONDS = 120; // 2 minutes maximum freshness
const GRAPH_API_VERSION = 'v21.0';

export interface InstagramDiagnosticStatus {
  tokenConfigured: boolean;
  tokenType: 'facebook_graph_eaa' | 'instagram_login_ig' | 'none';
  igUserIdConfigured: boolean;
  kvBound: boolean;
  source: 'live' | 'cache' | 'fallback';
  connectedUsername: string | null;
  mediaCount: number;
  lastLiveSuccessAt: string | null;
  lastError: string | null;
  checkedAt: string;
}

let inMemoryDiag: Partial<InstagramDiagnosticStatus> = {};

export const DUGDHSAR_DEFAULT_FEED: InstagramFeedResponse = {
  profile: {
    username: 'dugdhsar.in',
    followers_count: 45800,
    follows_count: 12,
    media_count: 182,
    profile_picture_url: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
  },
  media: [
    {
      id: 'ig-182947291029',
      caption:
        'Dawn milking round at Sukla Gaushala. Indigenous Gir cows pasture-fed on fresh clover & sweet grasses. Chilled to 4°C immediately. 🌿🥛 #Dugdhsar #GirCow #A2Milk #Seoni',
      media_type: 'VIDEO',
      media_url:
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
      thumbnail_url:
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      like_count: 2480,
      comments_count: 118,
    },
    {
      id: 'ig-182947291030',
      caption:
        'Sterilized glass bottles sealed fresh before 11:00 AM delivery. Zero plastic, zero preservatives, 100% pure raw enzymatic vitality. 🥛✨ #VedicDairy #Seoni #ColdChain',
      media_type: 'IMAGE',
      media_url:
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80',
      thumbnail_url:
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      like_count: 1845,
      comments_count: 72,
    },
    {
      id: 'ig-182947291031',
      caption:
        'Slow wooden bilona churning in earthen pots. Golden aromatic A2 Desi Cow Bilona Ghee with granular danedar texture. 🏺💛 #BilonaGhee #Ayurveda #Dugdhsar',
      media_type: 'VIDEO',
      media_url:
        'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=1200&q=80',
      thumbnail_url:
        'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      like_count: 3620,
      comments_count: 215,
    },
    {
      id: 'ig-182947291032',
      caption:
        'Sacred Ahimsa Sanctuary Ethics. Calves get their share first before any milking. 60 years of unwavering family tradition in Madhya Pradesh. 🐮🙏 #AhimsaMilk',
      media_type: 'IMAGE',
      media_url:
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1200&q=80',
      thumbnail_url:
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      like_count: 2190,
      comments_count: 94,
    },
    {
      id: 'ig-182947291033',
      caption:
        'Freshly curded Malai Paneer pressed naturally without acid chemicals or synthetic thickeners. Melts smoothly in traditional recipes. 🧀✨ #FreshPaneer #PureA2',
      media_type: 'CAROUSEL_ALBUM',
      media_url:
        'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=1200&q=80',
      thumbnail_url:
        'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      like_count: 1730,
      comments_count: 63,
    },
    {
      id: 'ig-182947291034',
      caption:
        'Visit our flagship physical retail counter at 3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni! Daily 5-10 AM & 6-10 PM. 📍🥛 #SeoniDairy',
      media_type: 'IMAGE',
      media_url: '/assets/vedic_gir_cow_meadow.jpg',
      thumbnail_url: '/assets/vedic_gir_cow_meadow.jpg',
      permalink: 'https://www.instagram.com/dugdhsar.in/',
      timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
      like_count: 2950,
      comments_count: 142,
    },
  ],
  updatedAt: new Date().toISOString(),
  source: 'fallback',
};

function detectTokenType(token: string | null): 'facebook_graph_eaa' | 'instagram_login_ig' | 'none' {
  if (!token) return 'none';
  if (token.startsWith('EAA')) return 'facebook_graph_eaa';
  return 'instagram_login_ig';
}

function getConfiguredIgUserId(env?: WorkerEnv): string | null {
  const fromEnv =
    env?.IG_USER_ID ||
    (typeof process !== 'undefined' && process.env ? process.env.IG_USER_ID : undefined);
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : null;
}

function sanitizeMetaError(rawError: unknown): string {
  const rawStr = typeof rawError === 'string' ? rawError : JSON.stringify(rawError || 'Unknown Meta API error');
  // Never leak any access tokens in diagnostic messages
  return rawStr
    .replace(/access_token=[^&\s"']+/gi, 'access_token=[REDACTED]')
    .replace(/(EAA|IGAA|IGQV)[A-Za-z0-9_-]{10,}/g, '[REDACTED_TOKEN]')
    .slice(0, 260);
}

async function parseMetaErrorResponse(res: Response): Promise<string> {
  try {
    const body: any = await res.json();
    if (body?.error?.message) {
      const code = body.error.code ? ` (code ${body.error.code})` : '';
      return sanitizeMetaError(`HTTP ${res.status}${code}: ${body.error.message}`);
    }
    return sanitizeMetaError(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  } catch {
    return sanitizeMetaError(`HTTP ${res.status}: Meta Graph API request failed`);
  }
}

async function recordDiag(
  env: WorkerEnv | undefined,
  patch: Partial<InstagramDiagnosticStatus>
): Promise<void> {
  inMemoryDiag = { ...inMemoryDiag, ...patch, checkedAt: new Date().toISOString() };
  try {
    await kvPutJSON(env, KV_KEY_IG_DIAG, inMemoryDiag, { expirationTtl: 86400 });
  } catch {
    // non-fatal diagnostic write
  }
}

// Retrieve current access token (KV key "ig_token" or secret IG_ACCESS_TOKEN)
export async function getInstagramToken(env?: WorkerEnv): Promise<string | null> {
  const kvToken = await kvGet(env, KV_KEY_IG_TOKEN);
  if (kvToken && kvToken.trim().length > 0) {
    return kvToken.trim();
  }
  const secretToken =
    env?.IG_ACCESS_TOKEN ||
    (typeof process !== 'undefined' && process.env ? process.env.IG_ACCESS_TOKEN : undefined);
  return secretToken && secretToken.trim().length > 0 ? secretToken.trim() : null;
}

// Auto-discover Instagram Business Account ID from a Meta Page/User EAA... token
async function resolveFacebookIgUserId(token: string, env?: WorkerEnv): Promise<string | null> {
  const configured = getConfiguredIgUserId(env);
  if (configured) return configured;

  const cachedId = await kvGet(env, KV_KEY_IG_USER_ID);
  if (cachedId && /^\d+$/.test(cachedId.trim())) {
    return cachedId.trim();
  }

  try {
    const pagesUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`;
    const res = await fetchWithCircuitBreaker(pagesUrl, { timeoutMs: 8000 });
    if (!res.ok) {
      const msg = await parseMetaErrorResponse(res);
      logger.warn('[Instagram Graph API] Unable to auto-discover IG Business Account ID', { error: msg });
      await recordDiag(env, { lastError: `IG_USER_ID auto-discovery failed: ${msg}` });
      return null;
    }

    const data: any = await res.json();
    const pages = Array.isArray(data?.data) ? data.data : [];
    const linked = pages.find((p: any) => p?.instagram_business_account?.id);
    if (linked?.instagram_business_account?.id) {
      const foundId = String(linked.instagram_business_account.id);
      await kvPut(env, KV_KEY_IG_USER_ID, foundId, { expirationTtl: 86400 });
      return foundId;
    }

    await recordDiag(env, {
      lastError:
        'No linked Instagram Business Account found on this Facebook token. Link your Instagram Professional account to a Facebook Page or set IG_USER_ID.',
    });
    return null;
  } catch (err: any) {
    await recordDiag(env, { lastError: sanitizeMetaError(err?.message || 'IG_USER_ID lookup error') });
    return null;
  }
}

function normalizeMediaItems(rawItems: any[], username: string): InstagramMediaItem[] {
  return rawItems
    .filter((item: any) => item && item.id && (item.media_url || item.thumbnail_url))
    .map((item: any) => {
      const mediaType = item.media_type || 'IMAGE';
      const isVideo = mediaType === 'VIDEO';
      return {
        id: String(item.id),
        caption: item.caption || '',
        media_type: mediaType,
        media_url: item.media_url || item.thumbnail_url,
        thumbnail_url: isVideo
          ? item.thumbnail_url || '/assets/vedic_gir_cow_meadow.jpg'
          : item.thumbnail_url || item.media_url,
        permalink: item.permalink || `https://www.instagram.com/${username}/`,
        timestamp: item.timestamp || new Date().toISOString(),
        like_count: typeof item.like_count === 'number' ? item.like_count : undefined,
        comments_count: typeof item.comments_count === 'number' ? item.comments_count : undefined,
      };
    });
}

async function fetchViaFacebookGraphApi(
  token: string,
  env?: WorkerEnv
): Promise<InstagramFeedResponse | null> {
  const igUserId = await resolveFacebookIgUserId(token, env);
  if (!igUserId) return null;

  let profile: InstagramProfile = {
    username: 'dugdhsar.in',
    profile_picture_url: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
  };

  // 1. Profile query (full metrics first, graceful minimal retry if scope is restricted)
  const fullProfileUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(
    igUserId
  )}?fields=username,followers_count,follows_count,media_count,profile_picture_url&access_token=${encodeURIComponent(token)}`;
  const profileRes = await fetchWithCircuitBreaker(fullProfileUrl, { timeoutMs: 8000 });
  if (profileRes.ok) {
    const pData: any = await profileRes.json();
    profile = {
      username: pData.username || 'dugdhsar.in',
      followers_count: typeof pData.followers_count === 'number' ? pData.followers_count : undefined,
      follows_count: typeof pData.follows_count === 'number' ? pData.follows_count : undefined,
      media_count: typeof pData.media_count === 'number' ? pData.media_count : undefined,
      profile_picture_url:
        pData.profile_picture_url || '/assets/aistudio/1000095715-clean_c92aa3a9.png',
    };
  } else {
    const minimalProfileUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(
      igUserId
    )}?fields=username,media_count&access_token=${encodeURIComponent(token)}`;
    const minRes = await fetchWithCircuitBreaker(minimalProfileUrl, { timeoutMs: 8000 });
    if (minRes.ok) {
      const pData: any = await minRes.json();
      profile = {
        username: pData.username || 'dugdhsar.in',
        media_count: typeof pData.media_count === 'number' ? pData.media_count : undefined,
        profile_picture_url: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
      };
    } else {
      const errMsg = await parseMetaErrorResponse(profileRes);
      logger.warn('[Instagram FB Graph API] Profile query failed', { error: errMsg });
    }
  }

  // 2. Media query (full engagement fields first, retry without engagement metrics if needed)
  const fullMediaUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(
    igUserId
  )}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${encodeURIComponent(token)}`;
  let mediaRes = await fetchWithCircuitBreaker(fullMediaUrl, { timeoutMs: 8000 });

  if (!mediaRes.ok) {
    const minimalMediaUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(
      igUserId
    )}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${encodeURIComponent(token)}`;
    const retryRes = await fetchWithCircuitBreaker(minimalMediaUrl, { timeoutMs: 8000 });
    if (retryRes.ok) {
      mediaRes = retryRes;
    } else {
      const errMsg = await parseMetaErrorResponse(mediaRes);
      await recordDiag(env, { lastError: errMsg });
      logger.warn('[Instagram FB Graph API] Media query failed', { error: errMsg });
      return null;
    }
  }

  const mediaData: any = await mediaRes.json();
  const items = Array.isArray(mediaData?.data) ? mediaData.data : [];
  if (items.length === 0) {
    await recordDiag(env, {
      lastError: 'Instagram account connected, but 0 published media posts were returned by Meta API.',
    });
    return null;
  }

  const media = normalizeMediaItems(items, profile.username);
  return {
    profile,
    media,
    updatedAt: new Date().toISOString(),
    source: 'live',
  };
}

async function fetchViaInstagramLoginGraphApi(
  token: string,
  env?: WorkerEnv
): Promise<InstagramFeedResponse | null> {
  let profile: InstagramProfile = {
    username: 'dugdhsar.in',
    profile_picture_url: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
  };

  // 1. Profile query (try full Instagram Login fields, gracefully fall back to minimal fields)
  const fullProfileUrl = `https://graph.instagram.com/${GRAPH_API_VERSION}/me?fields=user_id,username,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(token)}`;
  const profileRes = await fetchWithCircuitBreaker(fullProfileUrl, { timeoutMs: 8000 });

  if (profileRes.ok) {
    const pData: any = await profileRes.json();
    profile = {
      username: pData.username || 'dugdhsar.in',
      followers_count: typeof pData.followers_count === 'number' ? pData.followers_count : undefined,
      follows_count: typeof pData.follows_count === 'number' ? pData.follows_count : undefined,
      media_count: typeof pData.media_count === 'number' ? pData.media_count : undefined,
      profile_picture_url:
        pData.profile_picture_url || '/assets/aistudio/1000095715-clean_c92aa3a9.png',
    };
  } else {
    const minimalProfileUrl = `https://graph.instagram.com/me?fields=id,username,media_count,account_type&access_token=${encodeURIComponent(token)}`;
    const minRes = await fetchWithCircuitBreaker(minimalProfileUrl, { timeoutMs: 8000 });
    if (minRes.ok) {
      const pData: any = await minRes.json();
      profile = {
        username: pData.username || 'dugdhsar.in',
        media_count: typeof pData.media_count === 'number' ? pData.media_count : undefined,
        profile_picture_url: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
      };
    } else {
      const errMsg = await parseMetaErrorResponse(minRes);
      logger.warn('[Instagram Graph API] Profile query failed', { error: errMsg });
    }
  }

  // 2. Media query (try full fields with likes/comments, fall back to core fields if restricted)
  const fullMediaUrl = `https://graph.instagram.com/${GRAPH_API_VERSION}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${encodeURIComponent(token)}`;
  let mediaRes = await fetchWithCircuitBreaker(fullMediaUrl, { timeoutMs: 8000 });

  if (!mediaRes.ok) {
    const minimalMediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${encodeURIComponent(token)}`;
    const retryRes = await fetchWithCircuitBreaker(minimalMediaUrl, { timeoutMs: 8000 });
    if (retryRes.ok) {
      mediaRes = retryRes;
    } else {
      const errMsg = await parseMetaErrorResponse(mediaRes);
      await recordDiag(env, { lastError: errMsg });
      logger.warn('[Instagram Graph API] Media query failed', { error: errMsg });
      return null;
    }
  }

  const mediaData: any = await mediaRes.json();
  const items = Array.isArray(mediaData?.data) ? mediaData.data : [];
  if (items.length === 0) {
    await recordDiag(env, {
      lastError: 'Instagram token valid, but 0 media posts were returned by graph.instagram.com/me/media.',
    });
    return null;
  }

  const media = normalizeMediaItems(items, profile.username);
  return {
    profile,
    media,
    updatedAt: new Date().toISOString(),
    source: 'live',
  };
}

// Fetch feed from Instagram Graph API or return cached copy from KV
export async function getInstagramFeed(
  env?: WorkerEnv,
  options?: { forceRefresh?: boolean }
): Promise<InstagramFeedResponse> {
  const forceRefresh = Boolean(options?.forceRefresh);
  const isStale = (await kvGet(env, KV_KEY_IG_STALE)) === 'true';

  const cached = await kvGetJSON<{ feed: InstagramFeedResponse; cachedAt: number }>(
    env,
    KV_KEY_IG_FEED_CACHE
  );

  const now = Date.now();
  if (!forceRefresh && cached && !isStale && now - cached.cachedAt < CACHE_TTL_SECONDS * 1000) {
    return { ...cached.feed, source: 'cache' };
  }

  const token = await getInstagramToken(env);
  if (token) {
    try {
      const tokenType = detectTokenType(token);
      const hasExplicitUserId = Boolean(getConfiguredIgUserId(env));

      let freshFeed: InstagramFeedResponse | null = null;
      if (tokenType === 'facebook_graph_eaa' || hasExplicitUserId) {
        freshFeed = await fetchViaFacebookGraphApi(token, env);
      } else {
        freshFeed = await fetchViaInstagramLoginGraphApi(token, env);
      }

      if (freshFeed && freshFeed.media.length > 0) {
        await kvPutJSON(env, KV_KEY_IG_FEED_CACHE, { feed: freshFeed, cachedAt: now });
        await kvPut(env, KV_KEY_IG_STALE, 'false');
        await recordDiag(env, {
          source: 'live',
          connectedUsername: freshFeed.profile.username,
          mediaCount: freshFeed.media.length,
          lastLiveSuccessAt: freshFeed.updatedAt,
          lastError: null,
        });
        return freshFeed;
      }
    } catch (err: any) {
      const msg = sanitizeMetaError(err?.message || 'Live Instagram fetch exception');
      await recordDiag(env, { lastError: msg });
      logger.warn('[Instagram Graph API] Live fetch error, falling back to cache', { error: msg });
    }
  } else {
    await recordDiag(env, {
      source: 'fallback',
      lastError: 'IG_ACCESS_TOKEN secret is not configured in Cloudflare Workers yet.',
    });
  }

  // If live fetch failed or token missing, return previous cached feed if available
  if (cached?.feed) {
    return { ...cached.feed, source: 'cache' };
  }

  // Fallback to verified default feed for @dugdhsar.in
  return { ...DUGDHSAR_DEFAULT_FEED, source: 'fallback' };
}

// Public safe diagnostic status (NEVER exposes tokens or secrets)
export async function getInstagramConnectionStatus(
  env?: WorkerEnv
): Promise<InstagramDiagnosticStatus> {
  const token = await getInstagramToken(env);
  const tokenType = detectTokenType(token);
  const igUserId = getConfiguredIgUserId(env) || (await kvGet(env, KV_KEY_IG_USER_ID));
  const cached = await kvGetJSON<{ feed: InstagramFeedResponse; cachedAt: number }>(
    env,
    KV_KEY_IG_FEED_CACHE
  );
  const storedDiag =
    (await kvGetJSON<Partial<InstagramDiagnosticStatus>>(env, KV_KEY_IG_DIAG)) || inMemoryDiag;

  const isLiveConnected = Boolean(cached?.feed && cached.feed.source !== 'fallback');

  return {
    tokenConfigured: Boolean(token),
    tokenType,
    igUserIdConfigured: Boolean(igUserId),
    kvBound: Boolean(env?.CACHE),
    source: isLiveConnected ? (storedDiag.source || 'cache') : 'fallback',
    connectedUsername: cached?.feed?.profile?.username || storedDiag.connectedUsername || null,
    mediaCount: cached?.feed?.media?.length || storedDiag.mediaCount || 0,
    lastLiveSuccessAt: storedDiag.lastLiveSuccessAt || (isLiveConnected ? cached?.feed?.updatedAt || null : null),
    lastError:
      token
        ? storedDiag.lastError || null
        : 'IG_ACCESS_TOKEN is not set. Run `npx wrangler secret put IG_ACCESS_TOKEN` to connect @dugdhsar.in live.',
    checkedAt: new Date().toISOString(),
  };
}

// Cron Trigger (daily): Refresh long-lived token from Meta Graph API
export async function refreshInstagramToken(
  env?: WorkerEnv
): Promise<{ success: boolean; message: string }> {
  const currentToken = await getInstagramToken(env);
  if (!currentToken) {
    return { success: false, message: 'No Instagram token found to refresh' };
  }

  const tokenType = detectTokenType(currentToken);

  try {
    let refreshUrl: string;

    if (tokenType === 'facebook_graph_eaa') {
      const appId =
        env?.IG_APP_ID || (typeof process !== 'undefined' ? process.env.IG_APP_ID : undefined);
      const appSecret =
        env?.IG_APP_SECRET ||
        (typeof process !== 'undefined' ? process.env.IG_APP_SECRET : undefined);

      if (!appId || !appSecret) {
        return {
          success: false,
          message:
            'Facebook Graph EAA token refresh requires IG_APP_ID and IG_APP_SECRET (or use a never-expiring System User token).',
        };
      }

      refreshUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
        appId
      )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(
        currentToken
      )}`;
    } else {
      refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
        currentToken
      )}`;
    }

    const res = await fetchWithCircuitBreaker(refreshUrl, { timeoutMs: 8000, retrySafe: true });
    if (res.ok) {
      const data: any = await res.json();
      if (data.access_token) {
        await kvPut(env, KV_KEY_IG_TOKEN, data.access_token);
        logger.info('[Instagram Cron] Long-lived access token refreshed successfully');
        return { success: true, message: 'Token refreshed successfully' };
      }
    }
    const errMsg = await parseMetaErrorResponse(res);
    logger.warn('[Instagram Cron] Refresh call failed', { status: res.status, error: errMsg });
    return { success: false, message: `Refresh failed: ${errMsg}` };
  } catch (err: any) {
    const errMsg = sanitizeMetaError(err?.message || 'Refresh exception');
    logger.warn('[Instagram Cron] Exception', { error: errMsg });
    return { success: false, message: errMsg };
  }
}

// Meta Webhook: Verify X-Hub-Signature-256 using WebCrypto HMAC SHA-256
export async function verifyMetaHubSignature(
  signatureHeader: string | undefined,
  rawBody: string,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'sha256') return false;
  const expectedHash = parts[1].toLowerCase();

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHash === expectedHash;
  } catch (err) {
    console.warn('[Webhook] HMAC signature check error:', err);
    return false;
  }
}

// Mark Instagram feed cache as stale
export async function markInstagramCacheStale(env?: WorkerEnv): Promise<void> {
  await kvPut(env, KV_KEY_IG_STALE, 'true', { expirationTtl: 3600 });
}
