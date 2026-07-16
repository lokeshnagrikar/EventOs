# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should handle successful login flow, save session state, and redirect to switcher
- Location: tests\integration\auth-and-dashboard.spec.ts:42:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[id="email"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [active]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - navigation [ref=e7]:
            - button "previous" [disabled] [ref=e8]:
              - img "previous" [ref=e9]
            - generic [ref=e11]:
              - generic [ref=e12]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e13]:
              - img "next" [ref=e14]
          - img
        - generic [ref=e16]:
          - link "Next.js 15.5.19 (outdated) Webpack" [ref=e17] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e18]
            - generic "An outdated version detected (latest is 16.2.10), upgrade is highly recommended!" [ref=e20]: Next.js 15.5.19 (outdated)
            - generic [ref=e21]: Webpack
          - img
      - dialog "Runtime ReferenceError" [ref=e23]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e30]: Runtime ReferenceError
              - generic [ref=e31]:
                - button "Copy Error Info" [ref=e32] [cursor=pointer]:
                  - img [ref=e33]
                - button "No related documentation found" [disabled] [ref=e35]:
                  - img [ref=e36]
                - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools" [ref=e38] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
                  - img [ref=e39]
            - paragraph [ref=e48]: cn is not defined
          - generic [ref=e49]:
            - generic [ref=e50]:
              - paragraph [ref=e52]:
                - img [ref=e54]
                - generic [ref=e57]: src\components\onboarding\OnboardingWizard.tsx (128:36) @ eval
                - button "Open in editor" [ref=e58] [cursor=pointer]:
                  - img [ref=e60]
              - generic [ref=e63]:
                - generic [ref=e64]: "126 | key={segment.id}"
                - generic [ref=e65]: "127 | onClick={() => setSelectedSegment(segment.id)}"
                - generic [ref=e66]: "> 128 | className={cn("
                - generic [ref=e67]: "| ^"
                - generic [ref=e68]: 129 | "p-3 border rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer",
                - generic [ref=e69]: 130 | selectedSegment === segment.id
                - generic [ref=e70]: 131 | ? "border-purple-500 bg-purple-500/10 text-purple-450"
            - generic [ref=e71]:
              - generic [ref=e72]:
                - paragraph [ref=e73]:
                  - text: Call Stack
                  - generic [ref=e74]: "16"
                - button "Show 11 ignore-listed frame(s)" [ref=e75] [cursor=pointer]:
                  - text: Show 11 ignore-listed frame(s)
                  - img [ref=e76]
              - generic [ref=e78]:
                - generic [ref=e79]:
                  - text: eval
                  - button "Open eval in editor" [ref=e80] [cursor=pointer]:
                    - img [ref=e81]
                - text: src\components\onboarding\OnboardingWizard.tsx (128:36)
              - generic [ref=e83]:
                - generic [ref=e84]: Array.map
                - text: <anonymous>
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - text: OnboardingWizard
                  - button "Open OnboardingWizard in editor" [ref=e87] [cursor=pointer]:
                    - img [ref=e88]
                - text: src\components\onboarding\OnboardingWizard.tsx (122:38)
              - generic [ref=e90]:
                - generic [ref=e91]:
                  - text: Providers
                  - button "Open Providers in editor" [ref=e92] [cursor=pointer]:
                    - img [ref=e93]
                - text: src\app\providers.tsx (221:11)
              - generic [ref=e95]:
                - generic [ref=e96]:
                  - text: RootLayout
                  - button "Open RootLayout in editor" [ref=e97] [cursor=pointer]:
                    - img [ref=e98]
                - text: src\app\layout.tsx (103:9)
        - generic [ref=e100]:
          - generic [ref=e101]: "1"
          - generic [ref=e102]: "2"
    - generic [ref=e107] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e108]:
        - img [ref=e109]
      - generic [ref=e112]:
        - button "Open issues overlay" [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]: "0"
            - generic [ref=e116]: "1"
          - generic [ref=e117]: Issue
        - button "Collapse issues badge" [ref=e118]:
          - img [ref=e119]
  - 'heading "Application error: a client-side exception has occurred while loading localhost (see the browser console for more information)." [level=2] [ref=e123]'
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
> 80  |     await page.fill('input[id="email"]', 'demo@eventos.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
```