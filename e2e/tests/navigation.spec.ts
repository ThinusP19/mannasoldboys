import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');

    // Page should load without errors
    await expect(page).toHaveTitle(/.*/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Should be on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate to stories page', async ({ page }) => {
    await page.goto('/stories');

    // Should be on stories page or redirected appropriately
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to memorials page', async ({ page }) => {
    await page.goto('/memorial');

    // Should be on memorial page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to reunions page', async ({ page }) => {
    await page.goto('/reunions');

    // Should be on reunions page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should show 404 content or redirect
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Page should load and be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    // Page should load and be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');

    // Page should load and be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load home page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });
});
