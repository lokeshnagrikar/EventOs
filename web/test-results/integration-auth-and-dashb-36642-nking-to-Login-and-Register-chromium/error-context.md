# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should display Landing Page with CTAs linking to Login and Register
- Location: tests\integration\auth-and-dashboard.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Run your entire event business')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Run your entire event business')

```

```yaml
- 'heading "Application error: a client-side exception has occurred while loading localhost (see the browser console for more information)." [level=2]'
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('EventOS Frontend Integration & Authentication Flow', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Clear cookies/session storage and set bypass preloader flag before each integration test
  7   |     await page.goto('/');
  8   |     await page.evaluate(() => {
  9   |       sessionStorage.clear();
  10  |       localStorage.clear();
  11  |       localStorage.setItem('nopreload', 'true');
  12  |     });
  13  |   });
  14  | 
  15  |   test('should display Landing Page with CTAs linking to Login and Register', async ({ page }) => {
  16  |     await page.goto('/?nopreload=true');
  17  | 
  18  |     // Check Landing Page elements
  19  |     await expect(page.locator('text=The Operating System for Event Businesses')).toBeVisible();
> 20  |     await expect(page.locator('text=Run your entire event business')).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  21  | 
  22  |     // Check action buttons exist
  23  |     const createWorkspaceBtn = page.locator('text=Start Free Trial');
  24  |     const enterDashboardBtn = page.locator('text=Book a Demo');
  25  | 
  26  |     await expect(createWorkspaceBtn).toBeVisible();
  27  |     await expect(enterDashboardBtn).toBeVisible();
  28  | 
  29  |     // Click login button in the header
  30  |     await page.click('header >> text=Sign In');
  31  |     await expect(page).toHaveURL(/\/login/);
  32  |   });
  33  | 
  34  |   test('should enforce protected route redirects for unauthenticated users', async ({ page }) => {
  35  |     // Attempting to access dashboard, switcher, or settings directly
  36  |     await page.goto('/workspace-select');
  37  | 
  38  |     // Middleware should redirect user to login since hasSession cookie is missing
  39  |     await expect(page).toHaveURL(/\/login\?redirect=%2Fworkspace-select/);
  40  |   });
  41  | 
  42  |   test('should handle successful login flow, save session state, and redirect to switcher', async ({ page }) => {
  43  |     await page.goto('/login');
  44  | 
  45  |     // Intercept/mock login API response
  46  |     await page.route('**/api/v1/auth/login', async (route) => {
  47  |       await route.fulfill({
  48  |         status: 200,
  49  |         contentType: 'application/json',
  50  |         body: JSON.stringify({
  51  |           success: true,
  52  |           data: {
  53  |             accessToken: 'mock_jwt_access_token_xyz123',
  54  |             userId: '88888888-8888-8888-8888-888888888888',
  55  |             firstName: 'Demo',
  56  |             role: 'OWNER',
  57  |             tenantId: '99999999-9999-9999-9999-999999999999',
  58  |             memberships: [
  59  |               {
  60  |                 tenantId: '99999999-9999-9999-9999-999999999999',
  61  |                 companyId: 'company_abc',
  62  |                 companyName: 'Apex Wedding Planners',
  63  |                 role: 'OWNER',
  64  |                 status: 'ACTIVE'
  65  |               },
  66  |               {
  67  |                 tenantId: '11111111-1111-1111-1111-111111111111',
  68  |                 companyId: 'company_def',
  69  |                 companyName: 'Elite Corporate Events',
  70  |                 role: 'MANAGER',
  71  |                 status: 'ACTIVE'
  72  |               }
  73  |             ]
  74  |           }
  75  |         })
  76  |       });
  77  |     });
  78  | 
  79  |     // Fill in credentials
  80  |     await page.fill('input[id="email"]', 'demo@eventos.com');
  81  |     await page.fill('input[id="password"]', 'securePassword123');
  82  | 
  83  |     // Submit login form
  84  |     await page.click('button[type="submit"]');
  85  | 
  86  |     // Should redirect to Workspace Switcher page
  87  |     await expect(page).toHaveURL(/\/workspace-select/);
  88  | 
  89  |     // Verify session details saved in Session Storage via page evaluation
  90  |     const storedActiveTenant = await page.evaluate(() => sessionStorage.getItem('activeTenantId'));
  91  |     const storedUser = await page.evaluate(() => sessionStorage.getItem('user'));
  92  | 
  93  |     expect(storedActiveTenant).toBe('99999999-9999-9999-9999-999999999999');
  94  |     expect(storedUser).not.toBeNull();
  95  |     expect(storedUser!).toContain('demo@eventos.com');
  96  |     expect(storedUser!).toContain('Demo');
  97  |   });
  98  | 
  99  |   test('should switch workspace contexts and set appropriate HTTP headers', async ({ page }) => {
  100 |     // Set cookie first to prevent middleware redirecting to login page
  101 |     await page.context().addCookies([
  102 |       { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
  103 |     ]);
  104 | 
  105 |     // Pre-populate authenticated state using cookie and sessionStorage simulation
  106 |     await page.goto('/workspace-select');
  107 |     await page.evaluate(() => {
  108 |       sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
  109 |       sessionStorage.setItem('user', JSON.stringify({
  110 |         id: '88888888-8888-8888-8888-888888888888',
  111 |         email: 'demo@eventos.com',
  112 |         firstName: 'Demo',
  113 |         role: 'OWNER'
  114 |       }));
  115 |       sessionStorage.setItem('memberships', JSON.stringify([
  116 |         {
  117 |           tenantId: '99999999-9999-9999-9999-999999999999',
  118 |           companyName: 'Apex Wedding Planners',
  119 |           role: 'OWNER'
  120 |         },
```