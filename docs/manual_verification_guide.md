# Complete Manual Verification & Testing Guide

This guide details the step-by-step procedures to manually verify every dynamic frontend feature, UI component, and payment flow across the three key roles: **Super Admin (SaaS Owner)**, **Tenant (Agency Owner)**, and the **Client**.

---

## 👥 Role 1: Super Admin (SaaS Platform Owner)

This role manages SaaS plans, monitors subscriptions, and collects platform fees.

### Step 1: Landing Page Verification
1. Navigate to the homepage (`http://localhost:3000`).
2. Verify that the **Apple Capsule Navbar** floats cleanly and morphs dynamically when scrolling down the page.
3. Hover over the **Liquid Buttons** and ensure the purple/cyan neon underglow effects activate.
4. Verify that the bottom statistics row counts up and features radial spot glow matching the purple, pink, and cyan hover targets.
5. Confirm the **Pricing Section** is active and displays plans strictly in Indian Rupees (`₹1,999`, `₹5,999`, etc.).

### Step 2: SaaS Plan Registration & Stripe Check
1. Click **Get Started** or choose the **Starter Plan** from the Pricing Grid.
2. Fill in the tenant registration fields (Business name, email, password).
3. Ensure you are redirected to the Stripe Checkout session screen showing the plan cost in INR.
4. Complete a test payment (using Stripe test cards `4242 4242 4242 4242`).
5. Verify you are redirected back to the platform dashboard and receive the transactional welcome email.

---

## 🏢 Role 2: Tenant / Agency Owner

This role operates the event planning business, manages bookings, configures payments, and bills clients.

### Step 1: Account Setup & Customization
1. Log into your Dashboard.
2. Navigate to **Settings > Billing & Subscriptions**.
3. Confirm that the current plan is active and subscription invoice logs display pricing in `₹`.
4. Navigate to **Settings > Workspace Settings**.
5. Configure payment channels:
   * Input a mock UPI ID (e.g., `agency@okaxis`).
   * Upload a mockup UPI QR Code image.
   * Input bank details (Account No, IFSC, Bank Name).

### Step 2: Team Collaboration
1. Go to the **Team** tab.
2. Click **Invite Team Member**.
3. Input an email address, select a role (e.g., Coordinator), and send.
4. Verify that the invited member receives an invitation email containing a registration link.

### Step 3: Event CRM & Booking Workflow
1. Go to the **CRM/Leads** tab.
2. Drag and drop leads on the **Sales Kanban** board to verify state updates.
3. Click on a lead and convert it into a **Booking**.
4. Set an estimated event budget (e.g., `₹5,00,000`).

### Step 4: Generating Proposal & Invoices (INR)
1. In the booking panel, create a new **Quote/Proposal**.
2. Add line items (e.g., Venue rental, catering, photography) with INR prices.
3. Generate the **Invoice** for a partial deposit (e.g., ₹50,000).
4. Verify that all values on the screen show the Rupee symbol (`₹`) instead of `$`.
5. Click **Send to Client** to trigger the portal access notification.

---

## 👤 Role 3: Client (End Customer)

This role accepts quotes, pays invoices, coordinates event timelines, and downloads galleries.

### Step 1: Portal Access
1. Open the Client Portal URL sent to your email.
2. Authenticate or login (no extra app required).
3. Confirm that the portal header features the Agency's name and details.

### Step 2: Proposal Review & Signing
1. Click the **Documents/Quotes** tab.
2. Verify you can review the proposal items and final GST breakdown in INR (`₹`).
3. Click **Accept & Sign** to approve the quote.
4. Verify that the agency owner dashboard reflects the signed state.

### Step 3: Paying Invoice (QR Code / Bank Transfer)
1. Go to the **Invoices** tab.
2. Click **Pay Deposit** on the pending invoice.
3. Select **UPI/Bank Transfer** as the payment method.
4. Verify that the portal correctly displays:
   * The agency's uploaded UPI QR Code.
   * Direct bank details.
5. In the form, enter a mock UTR/Reference number, upload a receipt screenshot, and click **Submit Payment**.
6. Switch back to the **Agency Owner** screen and verify that the payment is marked as "Pending Review". Accept it and ensure invoice state turns to "Paid".
