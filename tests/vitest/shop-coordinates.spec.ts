import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../../src/config/site';
import {
  getShopCoordinates,
  getShopDirectionsUrl,
  getShopMapEmbedUrl,
  getShopMapsSearchUrl,
} from '../../src/config/siteHelpers';
import { getCspHeader } from '../../server/config/csp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const MAX_SHOP_DISTANCE_METRES = 100;

/**
 * Haversine great-circle distance in metres between two WGS84 lat/lng coordinates.
 */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function collectFiles(dir: string, extensions: Set<string>, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, extensions, out);
    } else if (extensions.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

describe('Shop Coordinates & Map Pin Accuracy', () => {
  const canonical = getShopCoordinates();

  it('stores valid, non-swapped Seoni shop coordinates in src/config/site.ts', () => {
    // Seoni, MP is around lat 22.08°N, lng 79.55°E
    expect(canonical.latitude).toBeGreaterThan(21.5);
    expect(canonical.latitude).toBeLessThan(22.6);
    expect(canonical.longitude).toBeGreaterThan(79.0);
    expect(canonical.longitude).toBeLessThan(80.1);
  });

  it('builds coordinate-pinned shop map embed, directions, and pin URLs (never address text)', () => {
    const expectedPair = `${canonical.latitude},${canonical.longitude}`;

    const embedUrl = getShopMapEmbedUrl(17);
    expect(embedUrl).toBe(
      `https://maps.google.com/maps?q=${expectedPair}&z=17&output=embed`
    );

    const directionsUrl = getShopDirectionsUrl();
    expect(directionsUrl).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${expectedPair}`
    );

    const searchUrl = getShopMapsSearchUrl();
    expect(searchUrl).toBe(`https://maps.google.com/?q=${expectedPair}`);
  });

  it('has zero shop coordinates in the repo more than 100 metres away from site.ts', () => {
    const scanDirs = [
      path.join(projectRoot, 'src'),
      path.join(projectRoot, 'public'),
      path.join(projectRoot, 'server'),
      path.join(projectRoot, 'scripts'),
    ];
    const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.txt', '.json']);
    const files: string[] = [];
    for (const dir of scanDirs) {
      collectFiles(dir, exts, files);
    }
    const indexHtml = path.join(projectRoot, 'index.html');
    if (fs.existsSync(indexHtml)) files.push(indexHtml);

    // Also verify prerendered dist/ HTML files if a build has been run
    const distDir = path.join(projectRoot, 'dist');
    if (fs.existsSync(distDir)) {
      collectFiles(distDir, new Set(['.html']), files);
    }

    // Regex matching Google Maps URLs containing numeric lat,lng query/destination params
    const gmapsCoordRegex =
      /https?:\/\/(?:www\.)?(?:maps\.google\.com|google\.com\/maps)[^"'\s<>]*?(?:[?&](?:q|query|destination)=)(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/gi;

    // Regex catching legacy 3HP5+948 address-text Google Maps URLs that geocoded ~25 km away
    const legacyBadMapUrlRegex =
      /https?:\/\/(?:www\.)?(?:maps\.google\.com|google\.com\/maps)[^"'\s<>]*(?:3HP5|Barghat|Sanjay\+Vihar|Sanjay%20Vihar)/i;

    const violations: string[] = [];

    for (const file of files) {
      const rel = path.relative(projectRoot, file);
      const content = fs.readFileSync(file, 'utf-8');

      if (legacyBadMapUrlRegex.test(content)) {
        violations.push(`${rel}: contains address-text / 3HP5 Google Maps URL for shop`);
      }

      let match: RegExpExecArray | null;
      gmapsCoordRegex.lastIndex = 0;
      while ((match = gmapsCoordRegex.exec(content)) !== null) {
        const lat = Number(match[1]);
        const lng = Number(match[2]);
        const dist = haversineMetres(canonical.latitude, canonical.longitude, lat, lng);
        if (dist > MAX_SHOP_DISTANCE_METRES) {
          violations.push(
            `${rel}: Google Maps coordinate (${lat}, ${lng}) is ${Math.round(dist)}m away from siteConfig.location (${canonical.latitude}, ${canonical.longitude}) [max ${MAX_SHOP_DISTANCE_METRES}m]`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('has zero geo.position / ICBM / JSON-LD shop coordinates further than 100m from site.ts', () => {
    // Verify siteConfig's own URLs also match within 100m
    const siteUrls = [
      siteConfig.location.googleMapsUrl,
      siteConfig.location.googleMapsDirectionsUrl,
      siteConfig.location.googleMapsEmbedUrl,
    ].filter((u): u is string => Boolean(u));

    const coordExtract = /(?:q|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
    for (const url of siteUrls) {
      const m = coordExtract.exec(url);
      expect(m, `Expected numeric lat,lng in ${url}`).not.toBeNull();
      if (m) {
        const dist = haversineMetres(
          canonical.latitude,
          canonical.longitude,
          Number(m[1]),
          Number(m[2])
        );
        expect(dist).toBeLessThanOrEqual(MAX_SHOP_DISTANCE_METRES);
      }
    }
  });

  it('allows https://maps.google.com and https://www.google.com in CSP frame-src', () => {
    const csp = getCspHeader();
    const frameSrcMatch = /frame-src\s+([^;]+)/.exec(csp);
    expect(frameSrcMatch).not.toBeNull();
    const frameSrc = frameSrcMatch?.[1] ?? '';
    expect(frameSrc).toContain('https://maps.google.com');
    expect(frameSrc).toContain('https://www.google.com');

    const headersPath = path.join(projectRoot, 'public', '_headers');
    const headersContent = fs.readFileSync(headersPath, 'utf-8');
    expect(headersContent).toContain('https://maps.google.com');
    expect(headersContent).toContain('https://www.google.com');
  });
});
