# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auth-and-dashboard.spec.ts >> EventOS Frontend Integration & Authentication Flow >> should display Landing Page with CTAs linking to Login and Register
- Location: web\tests\integration\auth-and-dashboard.spec.ts:15:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=The Operating System for Event Businesses')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=The Operating System for Event Businesses')

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - img "EO"
  - heading "Event OS" [level=1]
  - text: MANAGE. ENGAGE. ELEVATE.
  - navigation "Main Navigation":
    - link "Features":
      - /url: "#features"
    - button "Solutions":
      - text: Solutions
      - img
    - link "Pricing":
      - /url: "#pricing"
    - button "Resources":
      - text: Resources
      - img
  - button "Live Demo"
  - button "Login"
  - button "Get Started"
- main:
  - text: "The #1 All-in-One AI Operating System for Event Businesses"
  - heading "Plan. Automate. Scale Events. From Lead to Invoice." [level=1]
  - paragraph: The complete operating system for independent event coordinators and boutique agencies. Automate WhatsApp triggers, AI run-of-show timelines, mobile offline PWA check-ins, white-label client portals, and milestone invoicing.
  - button "Start 14-Day Free Trial"
  - button "Book a Demo"
  - text: "SSL Encrypted Tenant Isolated 99.9% Uptime SLA No Credit Card Required AI Auto-Scheduler 09:00 AM · Sound Check Approved Milestone Invoice ₹12,50,000 Deposit Cleared ✓ WhatsApp Automation RSVP Confirmed & Directions Sent Offline PWA Venue Check-In 1,250 Venue Guests Scanned admin.eventos.io/dashboard Tenant Isolation: active E U Workspace Dashboard"
  - heading "Event Command Center" [level=4]
  - text: "Q B I Lead Conversion Pipeline 84.2% ↑ +4.2% vs last month Active Event Bookings 142 Projects 32 Weddings · 110 Corporate Projected Revenue ₹8.4M Invoiced cleared: ₹7.2M Live Status: Quote #QT-2026-041 accepted by client (Sanjay Shah) View Pipeline → 0+"
  - heading "Events Managed" [level=5]
  - paragraph: Weddings, galas & corporate events
  - text: ₹0Cr+
  - heading "Revenue Processed" [level=5]
  - paragraph: Across all tenant workspaces
  - text: 0%
  - heading "Client Satisfaction" [level=5]
  - paragraph: Outstanding NPS index globally
  - paragraph: Trusted by high-end planners, luxury wedding agencies, and production teams globally
  - text: Vogue Weddings Apex Productions Echo Planners Horizon Galas Starlight Agency Nova Premium Events Vogue Weddings Apex Productions Echo Planners Horizon Galas Starlight Agency Nova Premium Events Vogue Weddings Apex Productions Echo Planners Horizon Galas Starlight Agency Nova Premium Events Vogue Weddings Apex Productions Echo Planners Horizon Galas Starlight Agency Nova Premium Events Starlight Agency Nova Premium Events Bloom Event Co. Summit Occasions Prestige Soirees Elara Weddings Starlight Agency Nova Premium Events Bloom Event Co. Summit Occasions Prestige Soirees Elara Weddings Starlight Agency Nova Premium Events Bloom Event Co. Summit Occasions Prestige Soirees Elara Weddings Starlight Agency Nova Premium Events Bloom Event Co. Summit Occasions Prestige Soirees Elara Weddings End-to-End Operating System
  - heading "Everything your agency needs, in one workspace." [level=2]
  - paragraph: Stop stitching together 6 different subscriptions. EventOS brings leads, proposals, timelines, invoices, client portals, and secure gallery sharing into a single tenant database.
  - text: AI Automation
  - heading "AI Co-pilot & Auto Scheduler" [level=3]
  - paragraph: AI algorithm that builds optimal vendor & timeline schedules without overlapping venue slots. Automatically resolves run-of-show sound checks and ingress conflicts.
  - text: Branding
  - heading "White-Label Client Portals" [level=3]
  - paragraph: Custom domains (events.yourbrand.com), custom logos, favicons, and tenant color themes. Give clients an enterprise-branded experience.
  - text: Offline PWA
  - heading "Mobile Offline Check-In PWA" [level=3]
  - paragraph: Seamless guest check-in for remote banquet lawns and basement venues with zero internet connectivity. Background sync flushes automatically once reconnected.
  - text: Messaging
  - heading "Automated WhatsApp & SMS Triggers" [level=3]
  - paragraph: Send automated updates for RSVP confirmations, invoice payment due dates, milestone clearance reminders, and venue direction links.
  - text: Quotes
  - heading "AI Proposal & Quote Generator" [level=3]
  - paragraph: Generate custom branded web & PDF proposals from client briefs in under 30 seconds with line-item scope breakdowns and digital signature clearing.
  - text: Media Delivery
  - heading "Gallery & Media Delivery" [level=3]
  - paragraph: Upload high-resolution event media. Deliver secure passcode-protected albums with custom download permissions and expiry links.
  - text: Predictive Intelligence
  - heading "AI Lead Scoring & Churn Predictor" [level=3]
  - paragraph: Intelligently predicts lead conversion likelihood (0-100), flags high-risk client cancellations before they happen, and triggers 1-click retention workflows.
  - text: Auto-tracked Complete Module Suite
  - heading "Six integrated modules. One unified workspace." [level=2]
  - paragraph: Every EventOS module talks to the others. A lead becomes a quote becomes a booking becomes an invoice becomes a gallery — automatically.
  - heading "CRM & Lead Pipeline" [level=3]
  - text: Acquisition
  - paragraph: Visual Kanban board. Track leads, budgets, and conversion stages in real time.
  - text: Inquiries 8 Proposal Sent 3 Booked 5
  - heading "Smart Quotes & Proposals" [level=3]
  - text: Conversion
  - paragraph: Line-item digital proposals. Clients sign online, auto-convert to bookings instantly.
  - text: Subtotal ₹14,50,000 GST 18% ₹2,61,000 Total ₹17,11,000
  - button "Accept & Sign →"
  - heading "Invoices & Payments" [level=3]
  - text: Finance
  - paragraph: Generate milestone invoices from accepted quotes. Track UPI, bank transfers, and card deposits.
  - text: Deposit (50%) ₹8,55,000 Paid Mid-Event (25%) ₹4,27,500 Pending Final (25%) ₹4,27,500 Upcoming
  - heading "Event Timelines & Tasks" [level=3]
  - text: Operations
  - paragraph: Drag-and-drop task boards. Assign vendors, staff, and photographers to event milestones.
  - text: 09:00 Team Check-in 11:30 Décor Setup 14:00 Sound Check 17:00 Guest Arrival
  - heading "Secure Gallery Delivery" [level=3]
  - text: Media
  - paragraph: Cloudinary-powered media albums. Passcode protection, expiry links, and granular download controls.
  - text: Expires in 30 days Download ZIP →
  - heading "White-Label Client Portal" [level=3]
  - text: Collaboration
  - paragraph: Dedicated client dashboard. Accept quotes, pay invoices, view timelines — no extra login required.
  - text: Proposal Status ✓ Accepted Outstanding Payment ₹50,000
  - button "Pay Now →"
  - text: Security & Infrastructure
  - heading "Enterprise-Grade Multi-Tenancy" [level=2]
  - paragraph: Engineered to secure tenant environments, protect planner databases, and provide isolated guest spaces for client portal approvals.
  - heading "Workspace Isolation" [level=3]
  - paragraph: Each tenant operates in a completely isolated container with separate DB schemas, avoiding any data leaks.
  - heading "Role-Based Access Control" [level=3]
  - paragraph: Granular permissions for Planners, Coordinators, Vendors, and Clients. Limit visibility to relevant documents.
  - heading "Team Collaboration" [level=3]
  - paragraph: Coordinators and planners share tasks, quotes, and timelines in real-time, syncing status updates instantly.
  - text: WORKSPACE_ROUTING_ROUTER MFA Secure GATEWAY
  - img
  - 'heading "Planner Tenant #1" [level=4]'
  - text: elite.eventos.io
  - 'heading "Planner Tenant #2" [level=4]'
  - text: stellar.eventos.io
  - heading "Schema-Isolated Databases" [level=4]
  - text: "Encrypted at rest · TLS 1.3 Tenant A: isolated Tenant B: isolated Active SSO session White-Label Client Portal"
  - heading "Give your clients a premium experience." [level=2]
  - paragraph: Every client gets a dedicated, secure portal — no extra app required. They can approve quotes, pay invoices, view timelines, and access galleries in one branded link.
  - paragraph: Preview Portal View
  - button "Event Dashboard"
  - button "Review Quote"
  - button "Pay Invoice"
  - button "View Timeline"
  - heading "Isolated & Secure" [level=4]
  - paragraph: Each client sees only their data — zero cross-contamination.
  - heading "Unique Invite Link" [level=4]
  - paragraph: One-click setup. Clients register via a secure invitation URL.
  - heading "Mobile-First Design" [level=4]
  - paragraph: Optimized for phones — clients access on-the-go.
  - heading "White-Label Ready" [level=4]
  - paragraph: Custom domain + logo mapping for Growth & Enterprise plans.
  - button "Try the Portal Demo"
  - button "Learn More"
  - text: portal.eventos.io/client/preeti-arjun
  - button "Event Dashboard"
  - button "Review Quote"
  - button "Pay Invoice"
  - button "View Timeline"
  - paragraph: Client Portal
  - heading "Preeti & Arjun — Wedding" [level=4]
  - text: Active Event Date
  - paragraph: 18 Oct 2026
  - text: Venue
  - paragraph: Taj Hotel, Delhi
  - text: Guest Count
  - paragraph: 450 Guests
  - text: Planner
  - paragraph: Sen Weddings
  - text: Your planner has updated the event timeline. Review new changes.
  - paragraph: Tenant Isolated
  - paragraph: Zero data cross-contamination
  - text: Client Stories 5.0 from 200+ agencies
  - heading "Endorsed by leading production teams." [level=2]
  - paragraph: See how high-volume event creators streamline their sales, billing, and scheduling using the EventOS suite.
  - text: AS
  - heading "Aparna Sen" [level=3]
  - paragraph: Founder, Sen Weddings & Co.
  - text: “
  - blockquote: "\"EventOS has transformed our wedding agency operations. Proposal drafting that took 4 hours now takes 15 minutes, and clients pay deposits instantly.\""
  - text: Wedding Planner Verified Agency
  - img
  - text: 15 min quotes
  - img
  - text: 2 years customer RK
  - heading "Rohan Kapoor" [level=3]
  - paragraph: Operations Lead, Peak Corporate
  - text: “
  - blockquote: "\"Our production team relies on EventOS for timeline scheduling. Shared vendor dashboards and client approval workflows are completely seamless.\""
  - text: Corporate Events Peak Corporate
  - img
  - text: Timeline Sync
  - img
  - text: 25+ vendors MN
  - heading "Meera Nair" [level=3]
  - paragraph: Creative Director, Vogue Gala
  - text: “
  - blockquote: "\"The media gallery feature is a lifesaver. We upload wedding deliverables directly, and clients love the secure, expiring guest links.\""
  - text: Creative Director Gala Specialist
  - img
  - text: Expiring links
  - img
  - text: Shared 20x VM
  - heading "Vikram Malhotra" [level=3]
  - paragraph: Managing Director, Apex Events India
  - text: “
  - blockquote: "\"Managing multiple corporate clients was chaos before EventOS. The multi-tenant workspace switching allows our managers to coordinate securely.\""
  - text: Multi-Tenant CRM Apex Events
  - img
  - text: Secure Tenants
  - img
  - text: SOC2 compliant SG
  - heading "Sanya Gupta" [level=3]
  - paragraph: Principal Planner, Luxe Soirees
  - text: “
  - blockquote: "\"Customer support is outstanding, and the product gets better every week. Having leads, quotes, invoices, and payment tracking under one hood is unbeatable.\""
  - text: Invoicing Automations Luxe Soirees
  - img
  - text: Invoice automate
  - img
  - text: Saves 15h/wk AM
  - heading "Arjun Mehta" [level=3]
  - paragraph: Co-founder, EliteDecor Events
  - text: “
  - blockquote: "\"We scaled from 20 to 80 events per year after switching to EventOS. The invoicing automation alone saves our accounts team 15 hours a week.\""
  - text: Scaled 4x EliteDecor
  - img
  - text: 80+ events/yr
  - img
  - text: EliteDecor team
  - button "Go to testimonial 1"
  - button "Go to testimonial 2"
  - button "Go to testimonial 3"
  - button "Go to testimonial 4"
  - button "Go to testimonial 5"
  - button "Go to testimonial 6"
  - img
  - text: Interactive ROI Calculator
  - heading "Calculate your time & revenue gains with EventOS" [level=2]
  - paragraph: See how much manual coordination time and lost deposit revenue EventOS recovers for your agency every month.
  - heading "Configure Your Agency Parameters" [level=3]
  - text: Events Managed per Month 8 Events
  - slider: "8"
  - text: 1 Event 20 Events 40+ Events Average Event Budget / Value ₹5.0 Lakh
  - slider: "500000"
  - text: ₹50K ₹15 Lakh ₹30 Lakh+ Coordinators & Team Seats 4 Members
  - slider: "4"
  - text: 1 Solo Planner 10 Seats 20 Seats
  - img
  - text: Calculations based on 2026 industry benchmarks across 10,000+ agency events. Estimated Impact Summary
  - heading "Your Monthly Yield" [level=4]
  - img
  - text: Time Reclaimed 128 hrs/mo +16 Days Saved
  - img
  - text: Scope Leakage Recovered ₹2.6 Lakh/mo Protected Estimated Annual Return 57x ROI Annual Net Value ₹41.2 Lakh
  - button "Unlock Your ROI — Start 14-Day Free Trial":
    - text: Unlock Your ROI — Start 14-Day Free Trial
    - img
  - article:
    - img
    - text: Transparent Pricing
    - heading "Plans tailored for your event business" [level=2]
    - paragraph: Trusted by event agencies and coordinators worldwide. Choose a tier to unlock automation, client portals, and multi-tenant scaling.
    - button "Monthly"
    - button "Yearly SAVE 20%"
  - heading "Starter" [level=3]
  - paragraph: Perfect for independent planners managing multiple event schedules.
  - text: ₹1,999 /month
  - heading "5 Active Events" [level=4]
  - list:
    - listitem:
      - img
      - text: 2 Team seats included
    - listitem:
      - img
      - text: 20 GB High-res media storage
    - listitem:
      - img
      - text: Milestone payments clearing
    - listitem:
      - img
      - text: Automated client contracts
    - listitem:
      - img
      - text: Standard email support queue
  - button "Start Free Trial":
    - text: Start Free Trial
    - img
  - img
  - text: Most Popular
  - heading "Professional" [level=3]
  - paragraph: Best value for active agencies & growing event organizations.
  - text: ₹5,999 /month
  - heading "Everything in Starter, plus:" [level=4]
  - list:
    - listitem:
      - img
      - text: 20 Active Events
    - listitem:
      - img
      - text: 5 Team seats included
    - listitem:
      - img
      - text: 100 GB High-res media storage
    - listitem:
      - img
      - text: EventOS AI Operations Co-pilot
    - listitem:
      - img
      - text: Interactive custom quotes editor
    - listitem:
      - img
      - text: Priority support queue SLA
  - button "Start Free Trial":
    - text: Start Free Trial
    - img
  - heading "Enterprise" [level=3]
  - paragraph: Advanced security & unlimited scale for large production houses.
  - text: ₹11,999 /month
  - heading "Everything in Professional, plus:" [level=4]
  - list:
    - listitem:
      - img
      - text: Unlimited Active Events & Seats
    - listitem:
      - img
      - text: 500 GB+ Dedicated AWS storage
    - listitem:
      - img
      - text: Custom white-labeled domains
    - listitem:
      - img
      - text: Developer API & webhooks access
    - listitem:
      - img
      - text: 24/7 Dedicated account manager
  - button "Contact Sales":
    - text: Contact Sales
    - img
  - text: Subscription Consolidator
  - heading "Ditch fragmented bills. Reclaim control." [level=3]
  - paragraph: Why event Planners and photography studio collectives waste ₹28,000+/mo across disconnected tools, and how EventOS replaces them under a single architecture.
  - table:
    - rowgroup:
      - row "Feature Sets EventOS HoneyBook HubSpot ClickUp Pixieset QuickBooks":
        - columnheader "Feature Sets"
        - columnheader "EventOS"
        - columnheader "HoneyBook"
        - columnheader "HubSpot"
        - columnheader "ClickUp"
        - columnheader "Pixieset"
        - columnheader "QuickBooks"
    - rowgroup:
      - row "Consolidated Workspace (CRM + Ledger + Gallery) ✔ Yes ✕ No ✕ No ✕ No ✕ No ✕ No":
        - cell "Consolidated Workspace (CRM + Ledger + Gallery)"
        - cell "✔ Yes"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
      - row "Schema-Based Multi-Tenant DB Isolation ✔ Yes (Private Schema) ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB ✕ Shared DB":
        - cell "Schema-Based Multi-Tenant DB Isolation"
        - cell "✔ Yes (Private Schema)"
        - cell "✕ Shared DB"
        - cell "✕ Shared DB"
        - cell "✕ Shared DB"
        - cell "✕ Shared DB"
        - cell "✕ Shared DB"
      - row "High-Res proofing galleries CDN integration ✔ Yes (AWS S3/CloudFront) ✕ No ✕ No ✕ No ✔ Yes ✕ No":
        - cell "High-Res proofing galleries CDN integration"
        - cell "✔ Yes (AWS S3/CloudFront)"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✔ Yes"
        - cell "✕ No"
      - row "Timeline Overlap Scheduling Alerts ✔ Yes (WebSocket sync) ✕ No ✕ No ✔ Yes (Basic) ✕ No ✕ No":
        - cell "Timeline Overlap Scheduling Alerts"
        - cell "✔ Yes (WebSocket sync)"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✔ Yes (Basic)"
        - cell "✕ No"
        - cell "✕ No"
      - row "Milestone Proposal contract acceptance ✔ Yes (Secure E-Sign) ✔ Yes ✕ No ✕ No ✕ No ✕ No":
        - cell "Milestone Proposal contract acceptance"
        - cell "✔ Yes (Secure E-Sign)"
        - cell "✔ Yes"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
        - cell "✕ No"
      - row "Unified Operational Monthly Cost ₹1,999 / mo ₹3,200 / mo ₹7,500 / mo ₹1,500 / mo ₹2,500 / mo ₹2,200 / mo":
        - cell "Unified Operational Monthly Cost"
        - cell "₹1,999 / mo"
        - cell "₹3,200 / mo"
        - cell "₹7,500 / mo"
        - cell "₹1,500 / mo"
        - cell "₹2,500 / mo"
        - cell "₹2,200 / mo"
  - img
  - text: Glassmorphic Support Desk
  - heading "Let's scale your event enterprise together." [level=2]
  - paragraph: Have questions about custom workflows, white-label setup, or enterprise migration? Drop us a line below. Our engineering team is here 24/7.
  - img
  - heading "Direct Email Desk" [level=4]
  - paragraph: Rapid response within 12 hours
  - link "hello@eventos.io →":
    - /url: mailto:hello@eventos.io
  - img
  - heading "Operational SLA" [level=4]
  - paragraph: Global support coverage
  - paragraph: Monday – Friday, 9:00 AM – 6:00 PM (SGT)
  - img
  - heading "Global Headquarters" [level=4]
  - paragraph: Isolated Enterprise Hub
  - paragraph: Singapore, Central Business District
  - heading "Submit Technical Inquiry" [level=3]
  - paragraph: Fill out your event details below to connect with an engineer.
  - text: Full Name *
  - textbox "Full Name *":
    - /placeholder: Jane Doe
  - text: Business Email *
  - textbox "Business Email *":
    - /placeholder: jane@agency.com
  - text: Agency Team Size
  - combobox "Agency Team Size":
    - option "1 – 5 Coordinators" [selected]
    - option "6 – 15 Coordinators"
    - option "16 – 50 Coordinators"
    - option "50+ Enterprise Planners"
  - text: Inquiry Message *
  - textbox "Inquiry Message *":
    - /placeholder: Tell us about your event operations, team size, and requirements...
  - button "Submit Glassmorphic Inquiry":
    - img
    - text: Submit Glassmorphic Inquiry
  - text: Free 14-Day Trial — No Credit Card Required
  - heading "Streamline your event operations today." [level=2]
  - paragraph: Connect your team, coordinate vendors, and delight clients from a single secure workspace. Cancel anytime, no lock-in.
  - text: Email address
  - textbox "Email address":
    - /placeholder: Enter your agency email
  - button "Get Started"
  - text: SSL Encrypted • SaaS Multi-Tenancy • 100% Isolated Data • No Credit Card
- contentinfo:
  - link "EventOS Home":
    - img "EO"
    - heading "Event OS" [level=4]
    - text: MANAGE. ENGAGE. ELEVATE.
  - paragraph: EventOS is the all-in-one operating system for event planners, wedding agencies, and production teams. Tenant-isolated, secure, and built for scale.
  - link "EventOS on X/Twitter":
    - /url: https://twitter.com
  - link "EventOS on GitHub":
    - /url: https://github.com
  - link "EventOS on LinkedIn":
    - /url: https://linkedin.com
  - link "EventOS on Instagram":
    - /url: https://instagram.com
  - text: All systems operational
  - heading "Product" [level=5]
  - list:
    - listitem:
      - link "CRM & Leads":
        - /url: "#features"
    - listitem:
      - link "Smart Quotes":
        - /url: "#features"
    - listitem:
      - link "Task Timelines":
        - /url: "#workflow"
    - listitem:
      - link "Modules Suite":
        - /url: "#modules"
    - listitem:
      - link "Gallery Delivery":
        - /url: "#features"
  - heading "Company" [level=5]
  - list:
    - listitem:
      - link "About Us":
        - /url: /about
    - listitem:
      - link "Templates Center":
        - /url: /resources
    - listitem:
      - link "Platform Security":
        - /url: /security
    - listitem:
      - link "System Status":
        - /url: /status
  - heading "Legal" [level=5]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /privacy
    - listitem:
      - link "Terms of Service":
        - /url: /terms
    - listitem:
      - link "Tenant SLA":
        - /url: /sla
    - listitem:
      - link "Cookie Policy":
        - /url: /cookies
  - text: "© 2026 EventOS Business Suite. All rights reserved. Build: v1.1.0-prod • Server Region: IN-WEST"
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
> 19  |     await expect(page.locator('text=The Operating System for Event Businesses')).toBeVisible();
      |                                                                                  ^ Error: expect(locator).toBeVisible() failed
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
```