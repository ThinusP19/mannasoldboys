import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check page title or heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for email input
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

    // Check for password input
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for empty form submission', async ({ page }) => {
    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('text=/required|invalid|enter/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should show error message (wait for API response)
    await expect(page.locator('text=/invalid|incorrect|error|failed/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have link to register page', async ({ page }) => {
    // Check for register link
    const registerLink = page.locator('a[href*="register"], a[href*="signup"], text=/register|sign up|create account/i');
    await expect(registerLink.first()).toBeVisible();
  });

  test('should have link to forgot password', async ({ page }) => {
    // Check for forgot password link
    const forgotLink = page.locator('a[href*="forgot"], text=/forgot|reset/i');
    await expect(forgotLink.first()).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated user from protected routes', async ({ page }) => {
    // Try to access profile page without logging in
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated user from admin routes', async ({ page }) => {
    // Try to access admin page without logging in
    await page.goto('/admin');

    // Should redirect to admin login
    await expect(page).toHaveURL(/admin.*login|login/);
  });
});
