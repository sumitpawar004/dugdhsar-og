/**
 * Dugdhsar Production Read-Only Smoke Test Suite
 * Tests against live deployment URL or local preview without writing or modifying any data.
 */

const TARGET_URL = (process.env.SMOKE_URL || 'http://localhost:3000').replace(/\/$/, '');

interface SmokeCheckResult {
  name: string;
  passed: boolean;
  status?: number;
  error?: string;
}

async function runSmokeTests() {
  console.log(`\n======================================================`);
  console.log(`   DUGDHSAR PRODUCTION READ-ONLY SMOKE TEST SUITE`);
  console.log(`   Target: ${TARGET_URL}`);
  console.log(`======================================================\n`);

  const results: SmokeCheckResult[] = [];

  // Helper fetcher with 8-second timeout
  async function checkUrl(name: string, path: string, options: { expectedStatus?: number; checkHeaders?: boolean; expectJson?: boolean } = {}) {
    const url = `${TARGET_URL}${path}`;
    const expected = options.expectedStatus ?? 200;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Dugdhsar-Smoke-Bot/2.0' },
        signal: AbortSignal.timeout(8000),
      });

      let passed = res.status === expected;
      let error: string | undefined;

      if (!passed) {
        error = `Expected HTTP ${expected}, received HTTP ${res.status}`;
      } else if (options.expectJson) {
        try {
          await res.json();
        } catch {
          passed = false;
          error = 'Failed to parse JSON response body';
        }
      } else if (options.checkHeaders) {
        const nosniff = res.headers.get('x-content-type-options');
        if (nosniff !== 'nosniff') {
          passed = false;
          error = `Missing x-content-type-options: nosniff (got: ${nosniff})`;
        }
      }

      results.push({ name, passed, status: res.status, error });
      const symbol = passed ? '✓' : '✗';
      console.log(`  ${symbol} [${res.status}] ${name.padEnd(35)} ${passed ? 'PASSED' : `FAILED (${error})`}`);
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message });
      console.error(`  ✗ [ERR] ${name.padEnd(35)} FAILED (${err.message})`);
    }
  }

  // 1. Homepage & Security Headers
  await checkUrl('Homepage HTML & Headers', '/', { expectedStatus: 200, checkHeaders: true });

  // 2. Health & API endpoints
  await checkUrl('/api/health JSON status', '/api/health', { expectedStatus: 200, expectJson: true });
  await checkUrl('/api/instagram/feed JSON', '/api/instagram/feed', { expectedStatus: 200, expectJson: true });

  // 3. Infrastructure files
  await checkUrl('Robots.txt Crawl Directives', '/robots.txt', { expectedStatus: 200 });
  await checkUrl('Sitemap.xml URL Set', '/sitemap.xml', { expectedStatus: 200 });

  // 4. Critical Public Pages
  await checkUrl('Shop Catalog Page', '/shop', { expectedStatus: 200 });
  await checkUrl('Our Story Heritage Page', '/our-story', { expectedStatus: 200 });
  await checkUrl('Contact Page', '/contact', { expectedStatus: 200 });

  // 5. 404 Unknown API Route Handling
  await checkUrl('Unknown API Route returns 404', '/api/non-existent-smoke-test-404-url', { expectedStatus: 404 });

  // Summary
  const failedCount = results.filter((r) => !r.passed).length;
  console.log('\n------------------------------------------------------');
  if (failedCount === 0) {
    console.log(`✅ ALL ${results.length} SMOKE CHECKS PASSED PERFECTLY!\n`);
    process.exit(0);
  } else {
    console.error(`❌ ${failedCount} OF ${results.length} SMOKE CHECKS FAILED!\n`);
    process.exit(1);
  }
}

runSmokeTests();
