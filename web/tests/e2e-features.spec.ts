import { test, expect } from '@playwright/test';

test.describe('EventOS Platform E2E Feature Suite', () => {
  
  test('1. Event Quote Calculator & PDF Proposal Export Flow', async ({ page }) => {
    // Navigate to Quote Calculator page
    await page.goto('/quote-calculator');

    // Check title and header presence
    await expect(page.locator('h2')).toContainText('Instant Event Quote Generator');

    // Verify default subtotal and guest slider
    const subtotalText = page.locator('text=Subtotal');
    await expect(subtotalText).toBeVisible();

    // Fill Promo Code EVENTOS10
    const promoInput = page.locator('input[placeholder="Try EVENTOS10 or VIP15"]');
    await promoInput.fill('EVENTOS10');
    await page.click('button:has-text("Apply")');

    // Open Preview Proposal modal
    await page.click('button:has-text("Preview Proposal")');
    await expect(page.locator('h1')).toContainText('EventOS Official Proposal');

    // Close preview modal
    await page.locator('button:has-text("Close"), svg').first().click();
  });

  test('2. Multi-Tenant Workspace Selector Pill in Navbar', async ({ page }) => {
    await page.goto('/');

    // Locate workspace selector pill
    const workspacePill = page.locator('button:has-text("Apex Events")');
    await expect(workspacePill).toBeVisible();

    // Click to open workspace dropdown
    await workspacePill.click();

    // Verify option "Royal Decorators" is visible
    const royalOption = page.locator('button:has-text("Royal Decorators")');
    await expect(royalOption).toBeVisible();

    // Switch workspace
    await royalOption.click();
    await expect(page.locator('button:has-text("Royal Decorators")')).toBeVisible();
  });

  test('3. WhatsApp 6-Digit OTP Auth Flow', async ({ page }) => {
    await page.goto('/?login=true');

    // Verify Auth Modal is visible
    const authHeader = page.locator('text=Sign In');
    await expect(authHeader).toBeVisible();

    // Click WhatsApp OTP tab
    const waTab = page.locator('button:has-text("WhatsApp OTP")');
    await waTab.click();

    // Fill WhatsApp phone number
    const phoneInput = page.locator('input[placeholder="+91 98765 43210"]');
    await phoneInput.fill('+91 98765 43210');

    // Click Send WhatsApp OTP
    await page.click('button:has-text("Send WhatsApp OTP")');

    // Check OTP 6-digit input view appears
    await expect(page.locator('text=Enter WhatsApp OTP')).toBeVisible();
  });

  test('4. Live WhatsApp Notification Simulator Widget', async ({ page }) => {
    await page.goto('/');

    // Locate floating WhatsApp trigger button
    const floatBtn = page.locator('button.shadow-2xl.shadow-emerald-950\\/60');
    await expect(floatBtn).toBeVisible();

    // Click to open notification drawer
    await floatBtn.click();
    await expect(page.locator('text=Live Booking Dispatch')).toBeVisible();

    // Click Test WhatsApp Dispatch button
    await page.click('button:has-text("Test WhatsApp Dispatch")');
  });

});
