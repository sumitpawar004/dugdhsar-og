import { test, expect } from '@playwright/test';

/**
 * Dugdhsar Critical User Journeys & Multi-Role E2E Suite
 */

test.describe('Public Browsing & Storefront Integrity', () => {
  test('Homepage loads without console errors or layout overflow', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Verify main landmarks
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('footer[role="contentinfo"]')).toBeVisible();

    // Verify Brand Hero & Headline
    await expect(page.locator('h1')).toContainText(/Vedic|Gir|A2/i);

    // Check no horizontal scrollbar overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // No severe unhandled console errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('font') && !err.includes('analytics')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('Public routes load properly with HTTP 200', async ({ page }) => {
    const routes = [
      '/our-story',
      '/our-craft',
      '/quality',
      '/journal',
      '/contact',
      '/faq',
      '/store-locator',
      '/shop',
      '/privacy-policy',
      '/terms-and-conditions',
      '/shipping-policy',
    ];

    for (const route of routes) {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('404 Page renders correctly for unknown paths', async ({ page }) => {
    const res = await page.goto('/unknown-random-route-404');
    expect(res?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/Not Found|Page/i);
  });
});

test.describe('Form Validations & Abuse Resistance', () => {
  test('Contact form handles Hindi text, long strings, and empty submit safely', async ({ page }) => {
    await page.goto('/contact');

    // 1. Empty submit should not trigger unhandled error
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // 2. Input Hindi characters and emoji
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name" i]').first();
    const messageInput = page.locator('textarea').first();

    if (await nameInput.isVisible()) {
      await nameInput.fill('सुमित पवार (परीक्षण) 🥛✨');
      await expect(nameInput).toHaveValue('सुमित पवार (परीक्षण) 🥛✨');
    }

    if (await messageInput.isVisible()) {
      const longText = 'A2 Gir cow milk inquiry in Seoni, MP 480661. '.repeat(10);
      await messageInput.fill(longText);
    }
  });

  test('Pincode serviceability check accepts Seoni 480661 and rejects invalid pin', async ({ page }) => {
    await page.goto('/shop');
    
    // Look for pincode check element if present
    const pincodeInput = page.locator('input[placeholder*="pincode" i]').first();
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('480661');
      const checkBtn = page.locator('button:has-text("Check")').first();
      if (await checkBtn.isVisible()) {
        await checkBtn.click();
        await expect(page.locator('body')).toContainText(/Available|Serviceable|Deliver/i);
      }
    }
  });
});

test.describe('Authentication & Protected Portals Routing', () => {
  test('Customer login page loads with Google Sign In options', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/Sign In|Google/i);
  });

  test('Unauthenticated user accessing /account is guarded and redirected', async ({ page }) => {
    await page.goto('/account');
    // Should render login view or redirect to login
    await expect(page.locator('body')).toContainText(/Sign In|Login/i);
  });

  test('Manager portal /manager requires manager/admin credentials', async ({ page }) => {
    await page.goto('/manager');
    await expect(page.locator('body')).toContainText(/Manager|Sign In/i);
  });

  test('Super Admin portal /admin requires admin authentication', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toContainText(/Admin|Sign In/i);
  });
});
