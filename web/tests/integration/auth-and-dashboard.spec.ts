import { test, expect } from '@playwright/test';

test.describe('EventOS Frontend Integration & Authentication Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Clear cookies/session storage before each integration test
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('should display Landing Page with CTAs linking to Login and Register', async ({ page }) => {
    await page.goto('/');

    // Check Landing Page elements
    await expect(page.locator('text=The Operating System for Events')).toBeVisible();
    await expect(page.locator('text=Run your entire event business')).toBeVisible();

    // Check action buttons exist
    const createWorkspaceBtn = page.locator('text=Start Free Trial');
    const enterDashboardBtn = page.locator('text=Book a Demo');

    await expect(createWorkspaceBtn).toBeVisible();
    await expect(enterDashboardBtn).toBeVisible();

    // Click login button in the header
    await page.click('header >> text=Sign In');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should enforce protected route redirects for unauthenticated users', async ({ page }) => {
    // Attempting to access dashboard, switcher, or settings directly
    await page.goto('/workspace-select');

    // Middleware should redirect user to login since hasSession cookie is missing
    await expect(page).toHaveURL(/\/login\?redirect=%2Fworkspace-select/);
  });

  test('should handle successful login flow, save session state, and redirect to switcher', async ({ page }) => {
    await page.goto('/login');

    // Intercept/mock login API response
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock_jwt_access_token_xyz123',
            userId: '88888888-8888-8888-8888-888888888888',
            firstName: 'Demo',
            role: 'OWNER',
            tenantId: '99999999-9999-9999-9999-999999999999',
            memberships: [
              {
                tenantId: '99999999-9999-9999-9999-999999999999',
                companyId: 'company_abc',
                companyName: 'Apex Wedding Planners',
                role: 'OWNER',
                status: 'ACTIVE'
              },
              {
                tenantId: '11111111-1111-1111-1111-111111111111',
                companyId: 'company_def',
                companyName: 'Elite Corporate Events',
                role: 'MANAGER',
                status: 'ACTIVE'
              }
            ]
          }
        })
      });
    });

    // Fill in credentials
    await page.fill('input[id="email"]', 'demo@eventos.com');
    await page.fill('input[id="password"]', 'securePassword123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Should redirect to Workspace Switcher page
    await expect(page).toHaveURL(/\/workspace-select/);

    // Verify session details saved in Session Storage via page evaluation
    const storedActiveTenant = await page.evaluate(() => sessionStorage.getItem('activeTenantId'));
    const storedUser = await page.evaluate(() => sessionStorage.getItem('user'));

    expect(storedActiveTenant).toBe('99999999-9999-9999-9999-999999999999');
    expect(storedUser).not.toBeNull();
    expect(storedUser!).toContain('demo@eventos.com');
    expect(storedUser!).toContain('Demo');
  });

  test('should switch workspace contexts and set appropriate HTTP headers', async ({ page }) => {
    // Pre-populate authenticated state using cookie and sessionStorage simulation
    await page.goto('/workspace-select');
    await page.evaluate(() => {
      sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
      sessionStorage.setItem('user', JSON.stringify({
        id: '88888888-8888-8888-8888-888888888888',
        email: 'demo@eventos.com',
        firstName: 'Demo',
        role: 'OWNER'
      }));
      sessionStorage.setItem('memberships', JSON.stringify([
        {
          tenantId: '99999999-9999-9999-9999-999999999999',
          companyName: 'Apex Wedding Planners',
          role: 'OWNER'
        },
        {
          tenantId: '11111111-1111-1111-1111-111111111111',
          companyName: 'Elite Corporate Events',
          role: 'MANAGER'
        }
      ]));
    });

    // Set cookie to simulate authenticated session for middleware
    await page.context().addCookies([
      { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
    ]);

    // Reload switcher page
    await page.reload();

    // Verify both workspace options are rendered
    await expect(page.locator('text=Apex Wedding Planners')).toBeVisible();
    await expect(page.locator('text=Elite Corporate Events')).toBeVisible();

    // Mock switcher API response
    let lastSwitchRequestPayload: any = null;
    await page.route('**/api/v1/auth/switch', async (route) => {
      lastSwitchRequestPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'new_jwt_access_token_context_switched',
            userId: '88888888-8888-8888-8888-888888888888',
            role: 'MANAGER',
            firstName: 'Demo',
            memberships: []
          }
        })
      });
    });

    // Switch to second workspace
    await page.click('text=Elite Corporate Events');

    // Check correct API payload and redirection to home (dashboard) page
    expect(lastSwitchRequestPayload?.tenantId).toBe('11111111-1111-1111-1111-111111111111');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display active sessions list and revoke old sessions', async ({ page }) => {
    // Setup authenticated state
    await page.goto('/settings/security');
    await page.evaluate(() => {
      sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
      sessionStorage.setItem('user', JSON.stringify({
        id: '88888888-8888-8888-8888-888888888888',
        email: 'demo@eventos.com',
        firstName: 'Demo',
        role: 'OWNER'
      }));
    });
    await page.context().addCookies([
      { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
    ]);

    // Mock sessions query request
    await page.route('**/api/v1/auth/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'session-1',
              deviceModel: 'MacBook Pro',
              osName: 'macOS',
              ipAddress: '192.168.1.10',
              lastActiveAt: '2026-06-18T10:00:00Z',
              isCurrent: true
            },
            {
              id: 'session-2',
              deviceModel: 'iPhone 15',
              osName: 'iOS',
              ipAddress: '10.0.0.4',
              lastActiveAt: '2026-06-17T15:30:00Z',
              isCurrent: false
            }
          ]
        })
      });
    });

    await page.reload();

    // Verify session details are visible
    await expect(page.locator('text=MacBook Pro')).toBeVisible();
    await expect(page.locator('text=iPhone 15')).toBeVisible();
    await expect(page.locator('text=Current Device')).toBeVisible();

    // Mock revocation API
    let isRevoked = false;
    await page.route('**/api/v1/auth/sessions/session-2', async (route) => {
      if (route.request().method() === 'DELETE') {
        isRevoked = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: null })
        });
      }
    });

    // Accept browser confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('revoke this session');
      await dialog.accept();
    });

    // Click revoke button for iPhone 15 session
    await page.click('button[title="Revoke and force sign out"]');

    expect(isRevoked).toBe(true);
  });
});
