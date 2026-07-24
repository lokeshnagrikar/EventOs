# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should switch workspace contexts and set appropriate HTTP headers
- Location: web\tests\integration\auth-and-dashboard.spec.ts:99:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/workspace-select", waiting until "load"

```

# Test source

```ts
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
  20  |     await expect(page.locator('text=Run your entire event business')).toBeVisible();
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
> 106 |     await page.goto('/workspace-select');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  121 |         {
  122 |           tenantId: '11111111-1111-1111-1111-111111111111',
  123 |           companyName: 'Elite Corporate Events',
  124 |           role: 'MANAGER'
  125 |         }
  126 |       ]));
  127 |     });
  128 | 
  129 |     // Reload switcher page to bind sessionStorage values to UI state
  130 |     await page.reload();
  131 | 
  132 |     // Verify both workspace options are rendered
  133 |     await expect(page.locator('text=Apex Wedding Planners')).toBeVisible();
  134 |     await expect(page.locator('text=Elite Corporate Events')).toBeVisible();
  135 | 
  136 |     // Mock switcher API response
  137 |     let lastSwitchRequestPayload: any = null;
  138 |     await page.route('**/api/v1/auth/switch', async (route) => {
  139 |       lastSwitchRequestPayload = route.request().postDataJSON();
  140 |       await route.fulfill({
  141 |         status: 200,
  142 |         contentType: 'application/json',
  143 |         body: JSON.stringify({
  144 |           success: true,
  145 |           data: {
  146 |             accessToken: 'new_jwt_access_token_context_switched',
  147 |             userId: '88888888-8888-8888-8888-888888888888',
  148 |             role: 'MANAGER',
  149 |             firstName: 'Demo',
  150 |             memberships: []
  151 |           }
  152 |         })
  153 |       });
  154 |     });
  155 | 
  156 |     // Switch to second workspace
  157 |     await page.click('text=Elite Corporate Events');
  158 | 
  159 |     // Check correct API payload and redirection to home (dashboard) page
  160 |     expect(lastSwitchRequestPayload?.tenantId).toBe('11111111-1111-1111-1111-111111111111');
  161 |     await expect(page).toHaveURL(/\/dashboard/);
  162 |   });
  163 | 
  164 |   test('should display active sessions list and revoke old sessions', async ({ page }) => {
  165 |     // Set cookie first to prevent middleware redirecting to login page
  166 |     await page.context().addCookies([
  167 |       { name: 'hasSession', value: 'true', domain: 'localhost', path: '/' }
  168 |     ]);
  169 | 
  170 |     // Setup authenticated state
  171 |     await page.goto('/settings/security');
  172 |     await page.evaluate(() => {
  173 |       sessionStorage.setItem('activeTenantId', '99999999-9999-9999-9999-999999999999');
  174 |       sessionStorage.setItem('user', JSON.stringify({
  175 |         id: '88888888-8888-8888-8888-888888888888',
  176 |         email: 'demo@eventos.com',
  177 |         firstName: 'Demo',
  178 |         role: 'OWNER'
  179 |       }));
  180 |     });
  181 | 
  182 |     // Reload page to apply authenticated context
  183 |     await page.reload();
  184 | 
  185 |     // Mock sessions query request
  186 |     await page.route('**/api/v1/auth/sessions', async (route) => {
  187 |       await route.fulfill({
  188 |         status: 200,
  189 |         contentType: 'application/json',
  190 |         body: JSON.stringify({
  191 |           success: true,
  192 |           data: [
  193 |             {
  194 |               id: 'session-1',
  195 |               deviceModel: 'MacBook Pro',
  196 |               osName: 'macOS',
  197 |               ipAddress: '192.168.1.10',
  198 |               lastActiveAt: '2026-06-18T10:00:00Z',
  199 |               isCurrent: true
  200 |             },
  201 |             {
  202 |               id: 'session-2',
  203 |               deviceModel: 'iPhone 15',
  204 |               osName: 'iOS',
  205 |               ipAddress: '10.0.0.4',
  206 |               lastActiveAt: '2026-06-17T15:30:00Z',
```