# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should display active sessions list and revoke old sessions
- Location: tests\integration\auth-and-dashboard.spec.ts:164:7

# Error details

```
Error: page.reload: Target page, context or browser has been closed
Call log:
  - waiting for navigation until "load"
    - navigated to "http://localhost:3000/settings/security"

```

# Test source

```ts
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
  207 |               isCurrent: false
  208 |             }
  209 |           ]
  210 |         })
  211 |       });
  212 |     });
  213 | 
> 214 |     await page.reload();
      |                ^ Error: page.reload: Target page, context or browser has been closed
  215 | 
  216 |     // Verify session details are visible
  217 |     await expect(page.locator('text=MacBook Pro')).toBeVisible();
  218 |     await expect(page.locator('text=iPhone 15')).toBeVisible();
  219 |     await expect(page.locator('text=Current Device')).toBeVisible();
  220 | 
  221 |     // Mock revocation API
  222 |     let isRevoked = false;
  223 |     await page.route('**/api/v1/auth/sessions/session-2', async (route) => {
  224 |       if (route.request().method() === 'DELETE') {
  225 |         isRevoked = true;
  226 |         await route.fulfill({
  227 |           status: 200,
  228 |           contentType: 'application/json',
  229 |           body: JSON.stringify({ success: true, data: null })
  230 |         });
  231 |       }
  232 |     });
  233 | 
  234 |     // Accept browser confirmation dialog
  235 |     page.on('dialog', async dialog => {
  236 |       expect(dialog.message()).toContain('revoke this session');
  237 |       await dialog.accept();
  238 |     });
  239 | 
  240 |     // Click revoke button for iPhone 15 session
  241 |     await page.click('button[title="Revoke and force sign out"]');
  242 | 
  243 |     expect(isRevoked).toBe(true);
  244 |   });
  245 | });
  246 | 
```