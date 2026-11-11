import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { securityHeadersMiddleware } from '../server/middleware/securityHeaders';
import { csrfProtection, isAllowedOrigin } from '../server/middleware/csrf';
import { validateOutboundUrl, APPROVED_OUTBOUND_DOMAINS } from '../server/lib/ssrf';
import { getSafeRedirectUrl } from '../server/middleware/validateRedirect';
import { safeJsonLdString } from '../src/lib/seo';
import { ForbiddenError, BadRequestError } from '../server/errors/AppError';

describe('Phase 3 Security - Security Headers Middleware', () => {
  it('attaches all mandatory security headers on responses', () => {
    const headersSet: Record<string, string> = {};
    const mockReq = { url: '/api/products', originalUrl: '/api/products' } as any;
    const mockRes = {
      setHeader: (name: string, value: string) => {
        headersSet[name.toLowerCase()] = value;
      },
    } as any;

    let nextCalled = false;
    securityHeadersMiddleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.ok(headersSet['strict-transport-security']?.includes('max-age=63072000'));
    assert.equal(headersSet['x-content-type-options'], 'nosniff');
    assert.equal(headersSet['x-frame-options'], 'SAMEORIGIN');
    assert.equal(headersSet['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.ok(headersSet['permissions-policy']?.includes('camera=()'));
    assert.equal(headersSet['cross-origin-opener-policy'], 'same-origin-allow-popups');
    assert.equal(headersSet['cross-origin-resource-policy'], 'same-origin');
    assert.ok(headersSet['cache-control']?.includes('no-store'));
  });
});

describe('Phase 3 Security - CSRF Origin & Referer Verification', () => {
  it('validates allowed origins and rejects unauthorized hosts', () => {
    assert.equal(isAllowedOrigin('https://dugdhsar.in'), true);
    assert.equal(isAllowedOrigin('https://www.dugdhsar.in'), true);
    assert.equal(isAllowedOrigin('http://localhost:3000'), true);
    assert.equal(isAllowedOrigin('http://127.0.0.1:8787'), true);
    assert.equal(isAllowedOrigin('https://preview-abc.run.app'), true);

    // Malicious or attacker domains
    assert.equal(isAllowedOrigin('https://evil-attacker.com'), false);
    assert.equal(isAllowedOrigin('http://dugdhsar.in.evil.com'), false);
    assert.equal(isAllowedOrigin('https://phishing-site.net'), false);
  });

  it('allows safe HTTP methods (GET, HEAD, OPTIONS) without origin check', () => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    for (const method of safeMethods) {
      let nextCalled = false;
      const req = { method, path: '/api/orders', headers: {} } as any;
      csrfProtection(req, {} as any, (err?: any) => {
        assert.equal(err, undefined);
        nextCalled = true;
      });
      assert.equal(nextCalled, true);
    }
  });

  it('blocks mutating POST request with unauthorized Origin header', () => {
    const req = {
      method: 'POST',
      path: '/api/orders/create',
      headers: {
        origin: 'https://evil-attacker.com',
      },
    } as any;

    let errCaught: any = null;
    csrfProtection(req, {} as any, (err?: any) => {
      errCaught = err;
    });

    assert.ok(errCaught instanceof ForbiddenError);
    assert.equal(errCaught.statusCode, 403);
  });

  it('allows mutating request with authorized Origin header', () => {
    const req = {
      method: 'POST',
      path: '/api/checkout/create-order',
      headers: {
        origin: 'https://dugdhsar.in',
      },
    } as any;

    let nextCalled = false;
    csrfProtection(req, {} as any, (err?: any) => {
      assert.equal(err, undefined);
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  it('bypasses CSRF checks for webhook exemption paths', () => {
    const webhookReq = {
      method: 'POST',
      path: '/api/instagram/webhook',
      headers: {},
    } as any;

    let nextCalled = false;
    csrfProtection(webhookReq, {} as any, (err?: any) => {
      assert.equal(err, undefined);
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  it('allows non-browser API clients with Bearer token when Origin is absent', () => {
    const apiReq = {
      method: 'POST',
      path: '/api/sheets/sync',
      headers: {
        authorization: 'Bearer valid_session_jwt_token',
      },
    } as any;

    let nextCalled = false;
    csrfProtection(apiReq, {} as any, (err?: any) => {
      assert.equal(err, undefined);
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });
});

describe('Phase 3 Security - SSRF Protection on Outbound Fetch', () => {
  it('allows valid approved outbound URLs', () => {
    const validUrl = 'https://sheets.googleapis.com/v4/spreadsheets/sheet_123/values/Orders:append';
    const parsed = validateOutboundUrl(validUrl, { strictAllowlist: true });
    assert.equal(parsed.hostname, 'sheets.googleapis.com');
  });

  it('rejects disallowed protocols (file:, ftp:, gopher:)', () => {
    const dangerousUrls = [
      'file:///etc/passwd',
      'ftp://ftp.example.com',
      'gopher://gopher.floodgap.com',
    ];

    for (const dUrl of dangerousUrls) {
      assert.throws(() => {
        validateOutboundUrl(dUrl);
      }, (err: any) => {
        assert.ok(err instanceof BadRequestError);
        return true;
      });
    }
  });

  it('blocks cloud metadata endpoint IP (169.254.169.254)', () => {
    const metadataUrl = 'http://169.254.169.254/computeMetadata/v1/';
    assert.throws(() => {
      validateOutboundUrl(metadataUrl);
    }, (err: any) => {
      assert.ok(err instanceof BadRequestError);
      assert.ok(err.message.includes('SSRF'));
      return true;
    });
  });

  it('rejects unapproved destination hosts when strictAllowlist is active', () => {
    const unapprovedUrl = 'https://untrusted-external-webhook-receiver.com/payload';
    assert.throws(() => {
      validateOutboundUrl(unapprovedUrl, { strictAllowlist: true });
    }, (err: any) => {
      assert.ok(err instanceof BadRequestError);
      assert.ok(err.message.includes('not on the approved outbound domain allowlist'));
      return true;
    });
  });
});

describe('Phase 3 Security - Open Redirect Prevention', () => {
  it('allows legitimate relative paths', () => {
    assert.equal(getSafeRedirectUrl('/shop'), '/shop');
    assert.equal(getSafeRedirectUrl('/account/subscriptions?view=active'), '/account/subscriptions?view=active');
    assert.equal(getSafeRedirectUrl('/products/vedic-bilona-cow-ghee'), '/products/vedic-bilona-cow-ghee');
  });

  it('neutralizes absolute external URLs to default fallback', () => {
    assert.equal(getSafeRedirectUrl('https://evil.com/phish'), '/');
    assert.equal(getSafeRedirectUrl('http://attacker.example.org'), '/');
  });

  it('neutralizes protocol-relative and backslash bypass attempts', () => {
    assert.equal(getSafeRedirectUrl('//evil.com/test'), '/');
    assert.equal(getSafeRedirectUrl('/\\evil.com'), '/');
    assert.equal(getSafeRedirectUrl('/%5cevil.com'), '/');
  });

  it('neutralizes javascript and data URI schemes', () => {
    assert.equal(getSafeRedirectUrl('javascript:alert(1)'), '/');
    assert.equal(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>'), '/');
  });

  it('handles null, undefined, and empty string safely', () => {
    assert.equal(getSafeRedirectUrl(null), '/');
    assert.equal(getSafeRedirectUrl(undefined), '/');
    assert.equal(getSafeRedirectUrl(''), '/');
    assert.equal(getSafeRedirectUrl('   '), '/');
  });
});

describe('Phase 3 Security - Anti-XSS JSON-LD Serialization', () => {
  it('escapes script closing tags and dangerous characters in JSON-LD', () => {
    const maliciousPayload = {
      name: 'Gir Cow Milk',
      description: '</script><script>alert("XSS")</script>',
      promo: 'Fresh & Pure <500mg>',
    };

    const serialized = safeJsonLdString(maliciousPayload);
    assert.ok(!serialized.includes('<script>'));
    assert.ok(!serialized.includes('</script>'));
    assert.ok(serialized.includes('\\u003c/script\\u003e'));
    assert.ok(serialized.includes('\\u003cscript\\u003e'));
    assert.ok(serialized.includes('\\u0026'));
  });
});
