/**
 * Build-time placeholder guard for `src/config/site.ts`.
 *
 * Fails if any string inside `siteConfig` still contains a `[PLACEHOLDER]` token
 * (for example `[YOUR EMAIL]`, `[FSSAI NUMBER]`, etc.).
 * Empty strings (such as an intentionally empty `gstin: ''`) are allowed.
 *
 * Usage:
 * - `npm run check:placeholders`        -> strictly exits with code 1 if placeholders remain.
 * - `tsx scripts/check-placeholders.ts --warn-in-dev`
 *     -> strictly exits with code 1 in production / CI environments
 *        (`NODE_ENV=production`, `CI=true`, `WORKERS_CI=1`, `CF_PAGES=1`),
 *        and prints a warning only in local non-CI development mode.
 */

import { siteConfig } from '../src/config/site';

const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

interface PlaceholderHit {
  path: string;
  value: string;
}

function findPlaceholders(value: unknown, currentPath = 'siteConfig'): PlaceholderHit[] {
  const hits: PlaceholderHit[] = [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && PLACEHOLDER_PATTERN.test(trimmed)) {
      hits.push({ path: currentPath, value: trimmed });
    }
    return hits;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(...findPlaceholders(item, `${currentPath}[${index}]`));
    });
    return hits;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      hits.push(...findPlaceholders(nested, `${currentPath}.${key}`));
    }
  }

  return hits;
}

const warnInDevFlag = process.argv.includes('--warn-in-dev');
const isCloudflareOrCi =
  process.env.CI === 'true' ||
  process.env.CI === '1' ||
  process.env.WORKERS_CI === '1' ||
  process.env.CF_PAGES === '1' ||
  process.env.GITHUB_ACTIONS === 'true';
const isAiStudioSandbox = Boolean(process.env.K_SERVICE) && !isCloudflareOrCi;
const isProductionBuild = process.env.NODE_ENV === 'production' && !isAiStudioSandbox;

const strict = !warnInDevFlag || isCloudflareOrCi || isProductionBuild;

const hits = findPlaceholders(siteConfig);

if (hits.length === 0) {
  console.log('[check:placeholders] OK — no [PLACEHOLDER] tokens left in src/config/site.ts.');
  process.exit(0);
}

console.error(
  `[check:placeholders] Found ${hits.length} unreplaced [PLACEHOLDER] value(s) in src/config/site.ts:`
);
for (const hit of hits) {
  console.error(`  - ${hit.path}: "${hit.value}"`);
}

if (strict) {
  console.error(
    '[check:placeholders] Production build aborted. Replace all [PLACEHOLDER] values in src/config/site.ts (leave optional fields like gstin as "").'
  );
  process.exit(1);
}

console.warn(
  '[check:placeholders] Continuing in local dev mode (--warn-in-dev). Production/CI builds will fail until these are replaced.'
);
process.exit(0);
