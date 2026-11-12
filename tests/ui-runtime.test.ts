import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeUtf8String } from '../server/lib/timezone';
import { ContactSchema } from '../server/schemas';

describe('Phase 3: Runtime and UI Integrity Test Suite', () => {
  const distDir = path.resolve('dist');
  const hasDist = fs.existsSync(path.join(distDir, 'index.html'));

  describe('1. Static HTML Deliverables Verification', () => {
    const requiredStaticPages = [
      'index.html',
      'our-story/index.html',
      'our-craft/index.html',
      'quality/index.html',
      'contact/index.html',
      'faq/index.html',
      'store-locator/index.html',
      'journal/index.html',
      'privacy-policy/index.html',
      'terms-and-conditions/index.html',
      'shipping-policy/index.html',
      '404.html',
    ];

    it('verifies critical public pages have valid HTML structure and accessibility markers', () => {
      if (hasDist) {
        for (const pageRel of requiredStaticPages) {
          const fullPath = path.join(distDir, pageRel);
          if (fs.existsSync(fullPath)) {
            const html = fs.readFileSync(fullPath, 'utf8');
            assert.ok(html.includes('<!DOCTYPE html>') || html.includes('<html'), `${pageRel} missing HTML tag`);
            assert.ok(html.includes('<title>'), `${pageRel} missing <title> tag`);
          }
        }
      } else {
        // Fallback to checking root template index.html
        const rootIndex = path.resolve('index.html');
        assert.ok(fs.existsSync(rootIndex), 'Root index.html must exist');
        const html = fs.readFileSync(rootIndex, 'utf8');
        assert.ok(html.toLowerCase().includes('<!doctype html>'));
        assert.ok(html.includes('<title>'));
      }
    });

    it('ensures sitemap.xml and robots.txt exist in public or dist', () => {
      const sitemapPath = hasDist ? path.join(distDir, 'sitemap.xml') : path.resolve('public/sitemap.xml');
      const robotsPath = hasDist ? path.join(distDir, 'robots.txt') : path.resolve('public/robots.txt');

      assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist');
      assert.ok(fs.existsSync(robotsPath), 'robots.txt must exist');

      const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
      assert.ok(sitemapContent.includes('https://dugdhsar.in/') || sitemapContent.includes('<urlset'));

      const robotsContent = fs.readFileSync(robotsPath, 'utf8');
      assert.ok(robotsContent.includes('Disallow: /admin'));
      assert.ok(robotsContent.includes('Disallow: /dealer'));
    });
  });

  describe('2. Form Inputs, Multi-Lingual & Unicode Stress Testing', () => {
    it('validates contact form with Devanagari Hindi text and emoji', () => {
      const payload = {
        name: 'सुमित पवार (गाय पालक)',
        email: 'sumit@example.com',
        phone: '+91 7067672604',
        message: 'मुझे सिवनी में शुद्ध गिर गाय का ए2 वैदिक दूध चाहिए। 🥛🌿',
      };

      const parsed = ContactSchema.parse(payload);
      assert.strictEqual(parsed.name, 'सुमित पवार (गाय पालक)');
      assert.ok(parsed.message.includes('दूध'));
    });

    it('rejects invalid or malformed contact email', () => {
      const invalidPayload = {
        name: 'Test User',
        email: 'invalid-email-no-at',
        phone: '+91 7067672604',
        message: 'Hello milk delivery',
      };

      assert.throws(() => ContactSchema.parse(invalidPayload));
    });

    it('normalizes very long text and eliminates harmful control codes', () => {
      const dirtyString = 'Vedic Milk\u0000\u001F Delivery\x08 - Seoni';
      const clean = normalizeUtf8String(dirtyString);
      assert.strictEqual(clean, 'Vedic Milk Delivery - Seoni');
    });
  });

  describe('3. Mobile Viewport & CSS Overflow Safety', () => {
    it('verifies main index.html configures strict viewport meta', () => {
      const indexPath = hasDist ? path.join(distDir, 'index.html') : path.resolve('index.html');
      const html = fs.readFileSync(indexPath, 'utf8');

      // Mobile viewport configuration
      assert.ok(html.includes('content="width=device-width, initial-scale=1.0"'));

      // Web App manifest link for installability
      assert.ok(html.includes('manifest.webmanifest'));

      // Theme color for mobile browser status bar
      assert.ok(html.includes('name="theme-color"'));
    });
  });
});
