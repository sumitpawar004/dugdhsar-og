/**
 * Production Build-Time Prerendering & Static Site Generation (SSG) Script
 * Generates crawlable static HTML (flat .html files for clean HTTP 200 without
 * trailing-slash redirects on Cloudflare Workers Static Assets), dynamic JSON-LD,
 * sitemap.xml, robots.txt, _headers, and _redirects.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { PUBLIC_ROUTES_META } from '../src/content';
import { siteConfig } from '../src/config/site';
import { generateSchemaGraph, safeJsonLdString } from '../src/lib/seo';
import { buildCloudflareHeadersFile } from '../server/config/csp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(urlOrPath?: string): string | undefined {
  if (!urlOrPath) return undefined;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${siteConfig.url}${cleanPath}`;
}

async function prerender() {
  console.log('🚀 [Prerender] Starting build-time static site generation for Dugdhsar...');

  if (!fs.existsSync(distDir)) {
    console.error('❌ [Prerender] dist/ directory not found. Please run "vite build" first.');
    process.exit(1);
  }

  const baseTemplatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(baseTemplatePath)) {
    console.error('❌ [Prerender] dist/index.html not found.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf-8');

  // 1. Prerender all Public Routes as flat .html files (dist/index.html for '/', dist/<route>.html for others)
  // Combined with wrangler.jsonc assets.html_handling = "drop-trailing-slash",
  // Cloudflare serves /privacy-policy, /terms-and-conditions, /cancellation-refund, /shipping-policy
  // directly with HTTP 200 and zero trailing-slash 307 redirects.
  console.log(`📄 [Prerender] Generating ${PUBLIC_ROUTES_META.length} public static HTML pages...`);

  for (const route of PUBLIC_ROUTES_META) {
    try {
      const appHtml = renderToString(React.createElement(App as any, { initialPath: route.path }));
      const schema = generateSchemaGraph(route);
      const schemaString = safeJsonLdString(schema);

      const safeTitle = escapeHtmlAttr(route.title);
      const safeDesc = escapeHtmlAttr(route.description);
      const safeCanonical = escapeHtmlAttr(route.canonical);
      const absoluteOgImage = toAbsoluteUrl(route.ogImage);

      let html = baseHtml;

      // Replace <title>
      html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);

      // Replace meta description
      html = html.replace(
        /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="description" content="${safeDesc}" />`
      );

      // Replace canonical link
      html = html.replace(
        /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
        `<link rel="canonical" href="${safeCanonical}" />`
      );

      // Replace OpenGraph & Twitter tags
      html = html.replace(
        /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:title" content="${safeTitle}" />`
      );
      html = html.replace(
        /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:description" content="${safeDesc}" />`
      );
      html = html.replace(
        /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:url" content="${safeCanonical}" />`
      );
      html = html.replace(
        /<meta\s+property=["']og:type["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:type" content="${escapeHtmlAttr(route.ogType || 'website')}" />`
      );
      if (absoluteOgImage) {
        const safeOgImg = escapeHtmlAttr(absoluteOgImage);
        html = html.replace(
          /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
          `<meta property="og:image" content="${safeOgImg}" />`
        );
        html = html.replace(
          /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
          `<meta name="twitter:image" content="${safeOgImg}" />`
        );
      }

      html = html.replace(
        /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="twitter:title" content="${safeTitle}" />`
      );
      html = html.replace(
        /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="twitter:description" content="${safeDesc}" />`
      );

      // Inject Schema.org JSON-LD
      const schemaTag = `<script type="application/ld+json">${schemaString}</script>`;
      if (html.includes('<script type="application/ld+json">')) {
        html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, schemaTag);
      } else {
        html = html.replace('</head>', `  ${schemaTag}\n</head>`);
      }

      // Inject rendered app HTML into root container
      html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

      // Determine output file path (flat .html for non-root paths)
      let outPath: string;
      if (route.path === '/' || route.path === '') {
        outPath = path.join(distDir, 'index.html');
      } else {
        const cleanPath = route.path.replace(/^\/+|\/+$/g, '');
        outPath = path.join(distDir, `${cleanPath}.html`);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
      }

      fs.writeFileSync(outPath, html, 'utf-8');
      console.log(`  ✓ Prerendered: ${route.path} -> ${path.relative(distDir, outPath)}`);
    } catch (err: any) {
      console.error(`  ❌ Failed to prerender ${route.path}:`, err.message);
      process.exitCode = 1;
    }
  }

  // 2. Generate Real HTTP 404 Page (dist/404.html)
  console.log('📄 [Prerender] Generating 404 Not Found page (dist/404.html)...');
  try {
    const notFoundHtmlApp = renderToString(React.createElement(App as any, { initialPath: '/404' }));
    let notFoundHtml = baseHtml;
    notFoundHtml = notFoundHtml.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>404 Page Not Found — ${escapeHtmlAttr(siteConfig.name)}</title>`
    );
    notFoundHtml = notFoundHtml.replace(
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="description" content="The requested page could not be found on ${escapeHtmlAttr(siteConfig.name)}." />`
    );
    notFoundHtml = notFoundHtml.replace(
      /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="robots" content="noindex, nofollow" />`
    );
    notFoundHtml = notFoundHtml.replace('<div id="root"></div>', `<div id="root">${notFoundHtmlApp}</div>`);
    fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');
    console.log('  ✓ Generated: dist/404.html');
  } catch (err: any) {
    console.error('  ❌ Failed to generate 404.html:', err.message);
  }

  // 3. Generate SPA Shells for Private / Protected App Routes with noindex (flat .html files)
  const privateRoutes = [
    '/login',
    '/account',
    '/account/login',
    '/account/register',
    '/account/profile',
    '/account/orders',
    '/account/addresses',
    '/account/subscriptions',
    '/account/milk-calendar',
    '/track-order',
    '/cart',
    '/checkout',
    '/dealer',
    '/dealer/login',
    '/manager',
    '/manager/login',
    '/admin',
    '/admin/login',
  ];

  console.log(`🔒 [Prerender] Generating ${privateRoutes.length} private SPA shells with noindex...`);
  for (const priv of privateRoutes) {
    const cleanPriv = priv.replace(/^\/+|\/+$/g, '');
    const outFile = path.join(distDir, `${cleanPriv}.html`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    let privHtml = baseHtml;
    privHtml = privHtml.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtmlAttr(siteConfig.name)} Portal</title>`
    );
    privHtml = privHtml.replace(
      /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="robots" content="noindex, nofollow" />`
    );
    fs.writeFileSync(outFile, privHtml, 'utf-8');
  }
  console.log('  ✓ Private SPA shells generated with noindex');

  // 4. Generate Dynamic XML Sitemap (dist/sitemap.xml)
  console.log('🗺️ [Prerender] Generating XML Sitemap (dist/sitemap.xml)...');
  const today = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PUBLIC_ROUTES_META.map((r) => {
  const absImg = toAbsoluteUrl(r.ogImage);
  const imageXml = absImg
    ? `    <image:image>
      <image:loc>${escapeXml(absImg)}</image:loc>
      <image:title>${escapeXml(r.title)}</image:title>
    </image:image>`
    : '';
  return `  <url>
    <loc>${escapeXml(r.canonical)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changeFreq || 'weekly'}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>${imageXml ? `\n${imageXml}` : ''}
  </url>`;
}).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('  ✓ Generated: dist/sitemap.xml');

  // 5. Generate Robots.txt (dist/robots.txt)
  console.log('🤖 [Prerender] Generating Robots.txt (dist/robots.txt)...');
  const robotsTxt = `# Robots.txt for ${siteConfig.name} (${siteConfig.url}/)

User-agent: *
Allow: /
Allow: /assets/
Allow: /api/products
Allow: /api/categories
Allow: /api/reviews
Allow: /api/health
Disallow: /api/
Disallow: /admin
Disallow: /dealer
Disallow: /manager
Disallow: /checkout
Disallow: /cart
Disallow: /account/

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${siteConfig.url}/sitemap.xml
`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('  ✓ Generated: dist/robots.txt');

  // 6. Generate Cloudflare Redirects (dist/_redirects)
  console.log('🔀 [Prerender] Generating Cloudflare Redirects (dist/_redirects)...');
  const redirects = `# Cloudflare Redirects File
/home                   /                     301!
/index.html             /                     301!
/about                  /our-story            301!
/story                  /our-story            301!
/craft                  /our-craft            301!
/ghee                   /products/ghee        301!
/milk                   /products/milk        301!
/paneer                 /products/paneer      301!
/curd                   /products/curd        301!
/dahi                   /products/curd        301!
/butter                 /products/butter      301!
/khoya                  /products/khoya-mawa  301!
/mawa                   /products/khoya-mawa  301!
/locator                /store-locator        301!
/stores                 /store-locator        301!
/location               /contact              301!
/terms                  /terms-and-conditions 301!
/privacy                /privacy-policy       301!
/refund                 /cancellation-refund  301!
/returns                /return-policy        301!
/shipping               /shipping-policy      301!
/blog                   /journal              301!
/articles               /journal              301!
`;
  fs.writeFileSync(path.join(distDir, '_redirects'), redirects, 'utf-8');
  console.log('  ✓ Generated: dist/_redirects');

  // 7. Generate Cloudflare Security & Caching Headers (dist/_headers)
  console.log('🛡️ [Prerender] Generating Cloudflare Edge Headers (dist/_headers)...');
  const headers = buildCloudflareHeadersFile();
  fs.writeFileSync(path.join(distDir, '_headers'), headers, 'utf-8');
  console.log('  ✓ Generated: dist/_headers');

  // Sync generated SEO/config files to public/
  fs.copyFileSync(path.join(distDir, '_redirects'), path.join(projectRoot, 'public', '_redirects'));
  fs.copyFileSync(path.join(distDir, '_headers'), path.join(projectRoot, 'public', '_headers'));
  fs.copyFileSync(path.join(distDir, 'robots.txt'), path.join(projectRoot, 'public', 'robots.txt'));
  fs.copyFileSync(path.join(distDir, 'sitemap.xml'), path.join(projectRoot, 'public', 'sitemap.xml'));

  console.log('✅ [Prerender] All phases completed successfully!');
}

prerender().catch((err) => {
  console.error('Fatal prerender error:', err);
  process.exit(1);
});
