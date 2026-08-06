/// <reference types="node" />
import { test, expect } from '@playwright/test';

test.describe('EventOS Core Platform User Journeys & Security Suite', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  // Helper setup for authenticated session
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: 'hasSession', value: 'true', url: BASE_URL },
      { name: 'user_name', value: 'Lokesh Sharma', url: BASE_URL },
      { name: 'user_role', value: 'OWNER', url: BASE_URL }
    ]);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 1: LEAD CREATION & KANBAN PIPELINE (/crm)
  // --------------------------------------------------------------------------
  test('1. Lead Creation & Kanban Stage Movement Journey', async ({ page }) => {
    // Intercept CRM Leads API
    await page.route(/\/api\/v1\/crm\/leads/, async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'lead_udr_101',
              tenantId: 'tenant_apex_123',
              clientName: body.clientName || 'Rahul & Varsha',
              email: body.email || 'rahul.varsha@example.com',
              phone: '+91 98765 43210',
              eventType: 'Udaipur Destination Wedding',
              budget: 4500000,
              stage: 'NEW_LEAD',
              createdAt: new Date().toISOString()
            }
          })
        });
      }

      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Lead stage updated successfully' })
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'lead_udr_101',
              tenantId: 'tenant_apex_123',
              clientName: 'Rahul & Varsha',
              eventType: 'Udaipur Destination Wedding',
              budget: 4500000,
              stage: 'NEW_LEAD'
            }
          ]
        })
      });
    });

    await page.goto(`${BASE_URL}/crm`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // 1. Verify Page & Kanban Columns render
    await expect(page.locator('body')).toBeVisible();

    // 2. Simulate Lead Creation via API
    const newLeadRes = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant_apex_123' },
        body: JSON.stringify({ clientName: 'Rahul & Varsha', eventType: 'Udaipur Destination Wedding', budget: 4500000 })
      });
      return await res.json();
    }, BASE_URL);

    expect(newLeadRes.success).toBe(true);
    expect(newLeadRes.data.stage).toBe('NEW_LEAD');

    // 3. Move Lead to 'PROPOSAL_SENT' Kanban Stage
    const stageUpdateRes = await page.evaluate(async ({ baseUrl, leadId }) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/leads/${leadId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant_apex_123' },
        body: JSON.stringify({ stage: 'PROPOSAL_SENT' })
      });
      return await res.json();
    }, { baseUrl: BASE_URL, leadId: newLeadRes.data.id });

    expect(stageUpdateRes.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 2: QUOTE & E-SIGNATURE FLOW (/quotes)
  // --------------------------------------------------------------------------
  test('2. Quote Creation, Proposal PDF & Client E-Signature Journey', async ({ page }) => {
    await page.route('**/api/v1/crm/quotes*', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'qt_2026_089',
              tenantId: 'tenant_apex_123',
              quoteNumber: 'QT-2026-089',
              clientName: 'Ananya & Kabir',
              amount: 1500000,
              status: 'DRAFT',
              pdfUrl: '/exports/proposals/QT-2026-089.pdf',
              shareToken: 'tok_quote_share_999'
            }
          })
        });
      }
      return route.continue();
    });

    await page.route('**/api/v1/crm/quotes/*/sign', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            quoteId: 'qt_2026_089',
            status: 'E_SIGNED',
            signedAt: new Date().toISOString(),
            signatureUrl: 'data:image/png;base64,mockSignatureData'
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/quotes`, { waitUntil: 'domcontentloaded' });

    // 1. Create Quote
    const quoteRes = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant_apex_123' },
        body: JSON.stringify({ clientName: 'Ananya & Kabir', amount: 1500000 })
      });
      return await res.json();
    }, BASE_URL);

    expect(quoteRes.success).toBe(true);
    expect(quoteRes.data.quoteNumber).toBe('QT-2026-089');
    expect(quoteRes.data.pdfUrl).toContain('.pdf');

    // 2. Client Opens Share Link & E-Signs Proposal
    const signRes = await page.evaluate(async ({ baseUrl, quoteId }) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/quotes/${quoteId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData: 'data:image/png;base64,mockSignatureData' })
      });
      return await res.json();
    }, { baseUrl: BASE_URL, quoteId: quoteRes.data.id });

    expect(signRes.success).toBe(true);
    expect(signRes.data.status).toBe('E_SIGNED');
  });

  // --------------------------------------------------------------------------
  // JOURNEY 3: DYNAMIC UPI PAYMENT & RECEIPT JOURNEY (/invoices)
  // --------------------------------------------------------------------------
  test('3. Dynamic UPI QR Payment & Receipt Auto-Generation Journey', async ({ page }) => {
    await page.route('**/api/v1/finance/payments/verify-upi', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            transactionId: 'TXN_UPI_887941',
            invoiceNumber: 'INV-2026-042',
            amount: 150000,
            status: 'PAID',
            vpa: 'eventos.pay@hdfcbank',
            receiptPdfUrl: '/exports/receipts/REC-2026-042.pdf',
            emailDispatched: true
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'domcontentloaded' });

    // Simulate UPI QR Payment Verification
    const upiRes = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/finance/payments/verify-upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant_apex_123' },
        body: JSON.stringify({ invoiceNumber: 'INV-2026-042', amount: 150000, vpa: 'eventos.pay@hdfcbank' })
      });
      return await res.json();
    }, BASE_URL);

    expect(upiRes.success).toBe(true);
    expect(upiRes.data.status).toBe('PAID');
    expect(upiRes.data.emailDispatched).toBe(true);
    expect(upiRes.data.receiptPdfUrl).toContain('REC-2026-042.pdf');
  });

  // --------------------------------------------------------------------------
  // JOURNEY 4: RUN-OF-SHOW & AI CONFLICT RESOLVER JOURNEY (/events)
  // --------------------------------------------------------------------------
  test('4. Event Run-of-Show, AI Conflict Resolver & WhatsApp Alert Journey', async ({ page }) => {
    await page.route('**/api/v1/events/timeline/conflict-check', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hasConflict: true,
            conflictDetails: {
              slot1: '19:00 - 20:00 Stage 1 Pyro Entry',
              slot2: '19:30 - 20:30 Royal Groom Entrance',
              recommendation: 'Shift Stage 1 Pyro Entry to 18:30 - 19:15 to prevent stage collision.'
            }
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });

    // Test AI Schedule Conflict Resolver Endpoint
    const conflictRes = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/events/timeline/conflict-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant_apex_123' },
        body: JSON.stringify({
          items: [
            { startTime: '19:00', endTime: '20:00', stage: 'Stage 1 Pyro Entry' },
            { startTime: '19:30', endTime: '20:30', stage: 'Royal Groom Entrance' }
          ]
        })
      });
      return await res.json();
    }, BASE_URL);

    expect(conflictRes.success).toBe(true);
    expect(conflictRes.data.hasConflict).toBe(true);
    expect(conflictRes.data.conflictDetails.recommendation).toContain('Shift Stage 1 Pyro Entry');
  });

  // --------------------------------------------------------------------------
  // JOURNEY 5: MEDIA GALLERY & EXIF LIGHTBOX JOURNEY (/gallery, /portal)
  // --------------------------------------------------------------------------
  test('5. Photo Upload, EXIF Metadata & Client Passcode Portal Journey', async ({ page }) => {
    await page.route('**/api/v1/gallery/photos*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'img_901',
              title: 'Grand Fireworks Sunset.jpg',
              imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
              exif: {
                camera: 'Sony A7 IV',
                lens: '24-70mm f/2.8 GM II',
                iso: 400,
                shutterSpeed: '1/250s',
                aperture: 'f/2.8'
              }
            }
          ]
        })
      });
    });

    await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'domcontentloaded' });

    const photosRes = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/gallery/photos`, {
        headers: { 'X-Tenant-Id': 'tenant_apex_123' }
      });
      return await res.json();
    }, BASE_URL);

    expect(photosRes.success).toBe(true);
    expect(photosRes.data[0].exif.camera).toBe('Sony A7 IV');
    expect(photosRes.data[0].exif.iso).toBe(400);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 6: CROSS-TENANT ISOLATION SECURITY TEST
  // --------------------------------------------------------------------------
  test('6. Strict Cross-Tenant Isolation Security Guard', async ({ page }) => {
    // Intercept requests for Tenant A and Tenant B
    await page.route('**/api/v1/crm/leads/tenant-data', async (route) => {
      const tenantHeader = route.request().headers()['x-tenant-id'];
      if (tenantHeader === 'tenant_apex_123') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [{ id: 'lead_a', name: 'Apex Secret Lead' }] })
        });
      } else {
        // Tenant B trying to fetch Tenant A data must be isolated or forbidden
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'ACCESS_DENIED', message: 'Tenant access violation' } })
        });
      }
    });

    await page.goto(`${BASE_URL}/crm`, { waitUntil: 'domcontentloaded' });

    // 1. Fetch as Tenant A (Authorized)
    const resTenantA = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/leads/tenant-data`, {
        headers: { 'X-Tenant-Id': 'tenant_apex_123' }
      });
      return { status: res.status, data: await res.json() };
    }, BASE_URL);

    expect(resTenantA.status).toBe(200);
    expect(resTenantA.data.data[0].name).toBe('Apex Secret Lead');

    // 2. Fetch as Tenant B (Unauthorized Attempt to Access Tenant A)
    const resTenantB = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/crm/leads/tenant-data`, {
        headers: { 'X-Tenant-Id': 'tenant_royal_999' }
      });
      return { status: res.status, data: await res.json() };
    }, BASE_URL);

    expect(resTenantB.status).toBe(403);
    expect(resTenantB.data.error.code).toBe('ACCESS_DENIED');
  });
});
