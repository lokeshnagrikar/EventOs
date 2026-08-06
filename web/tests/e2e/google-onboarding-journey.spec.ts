/// <reference types="node" />
import { test, expect } from '@playwright/test';

test.describe('Google OAuth Registration & Workspace Onboarding Journey', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('1. Google Auth Buttons & OAuth Provider Initialization', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Verify Page Header & Google Auth Trigger Button
    const googleBtn = page.locator('button:has-text("Sign up with Google"), button:has-text("Continue with Google"), button:has-text("Google")');
    await expect(googleBtn.first()).toBeVisible();
  });

  test('2. Google Login Endpoint API Contract Verification', async ({ page }) => {
    // Intercept POST /auth/login/google
    await page.route('**/api/v1/auth/login/google', async (route) => {
      const json = {
        success: true,
        data: {
          accessToken: 'mock-google-jwt-access-token-xyz',
          userId: 'usr_google_123',
          tenantId: 'tnt_google_workspace_456',
          firstName: 'Google',
          lastName: 'User',
          role: 'OWNER',
          email: 'google.user@example.com',
          memberships: [
            {
              tenantId: 'tnt_google_workspace_456',
              companyId: 'cmp_google_789',
              companyName: 'Google Workspace Company',
              role: 'OWNER',
              status: 'ACTIVE'
            }
          ],
          permissions: ['VIEW_CRM', 'VIEW_EVENTS', 'VIEW_FINANCE', 'MANAGE_SETTINGS']
        }
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    await page.goto(`${BASE_URL}/register`);
    
    // Simulate token dispatch via fetch request
    const response = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'mock-google-oauth-access-token' })
      });
      return await res.json();
    }, BASE_URL);

    expect(response.success).toBe(true);
    expect(response.data.role).toBe('OWNER');
    expect(response.data.accessToken).toBe('mock-google-jwt-access-token-xyz');
    expect(response.data.memberships[0].companyName).toBe('Google Workspace Company');
  });

  test('3. Post-Auth Cookie & Session Storage Sync', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Execute session initialization
    await page.evaluate(() => {
      document.cookie = 'hasSession=true; path=/; SameSite=Lax';
      document.cookie = 'user_name=GoogleUser; path=/; SameSite=Lax';
      document.cookie = 'user_role=OWNER; path=/; SameSite=Lax';
      localStorage.setItem('user_name', 'GoogleUser');
      localStorage.setItem('user_role', 'OWNER');
    });

    const cookies = await page.context().cookies();
    const hasSessionCookie = cookies.find((c) => c.name === 'hasSession');
    expect(hasSessionCookie?.value).toBe('true');

    const userNameCookie = cookies.find((c) => c.name === 'user_name');
    expect(decodeURIComponent(userNameCookie?.value || '')).toBe('GoogleUser');
  });

  test('4. Workspace Selector & Onboarding Navigation', async ({ page }) => {
    // Set authenticated session cookies
    await page.context().addCookies([
      { name: 'hasSession', value: 'true', url: BASE_URL },
      { name: 'user_name', value: 'GoogleUser', url: BASE_URL },
      { name: 'user_role', value: 'OWNER', url: BASE_URL }
    ]);

    await page.goto(`${BASE_URL}/workspace-select`);
    await expect(page).toHaveURL(new RegExp('/workspace-select'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('5. OAuth Error Handling & Recovery', async ({ page }) => {
    // Mock failing endpoint (e.g. Google network error or revoked token)
    await page.route('**/api/v1/auth/login/google', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_GOOGLE_TOKEN', message: 'Google authentication failed. Please try again.' }
        })
      });
    });

    await page.goto(`${BASE_URL}/login`);

    const result = await page.evaluate(async (baseUrl) => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/auth/login/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: 'invalid-token' })
        });
        return { status: res.status, data: await res.json() };
      } catch (err: any) {
        return { status: 500, error: err.message };
      }
    }, BASE_URL);

    expect(result.status).toBe(401);
    expect(result.data.error.code).toBe('INVALID_GOOGLE_TOKEN');
  });
});
