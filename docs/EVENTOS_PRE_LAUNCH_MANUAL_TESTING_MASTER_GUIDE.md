# 🎯 EventOS — Pre-Launch Master Manual Testing & QA Guide

> **Official 3-Phase Verification Walkthrough**:
>
> 1. **Phase 1**: Agency Owner Dashboard & Core Operating Features
> 2. **Phase 2**: Client Portal & Real Quote Approval Experience
> 3. **Phase 3**: SuperAdmin Platform Administration Console

---

## 🔑 0. Pre-Flight Credentials & URLs

| Role / Surface          | URL                                        | Test Credentials                                                          | What to Check                                          |
| :---------------------- | :----------------------------------------- | :------------------------------------------------------------------------ | :----------------------------------------------------- |
| **Agency Owner**  | `http://localhost:3000/?login=true`      | Your registered email / password (or create new via**Get Started**) | Full Agency Operations, CRM, Quotes, Finance, Settings |
| **Client Portal** | `http://localhost:3000/portal`           | Magic Token / Share Link from Quote                                       | Quote Approval, Invoices, Timeline, Gallery            |
|                         |                                            |                                                                           |                                                        |
| **SuperAdmin**    | `http://localhost:3000/superadmin/login` | `admin@eventos.com` / `admin123`                                      | Multi-Tenant Management, Health, Audit Logs            |

---

## 🏢 PHASE 1: Agency Owner Dashboard (Core Features)

Follow this exact sequential workflow to test how an event planner runs their business daily:

### 1.1 Authentication & Workspace Home (`/`)

- [X] **Login**: Visit `http://localhost:3000/?login=true` and enter your Agency Owner credentials.
- [X] **Session Check**: Verify you land on the dashboard without redirects or console errors.
- [X] **Header Metrics**: Check the top stats cards (Active Events, Monthly Revenue, Pending Invoices).
- [X] **Quick Action FAB (Bottom Right)**:
  - Click the purple floating `+` button.
  - Test quick triggers: **New Lead**, **New Quote**, **New Event**. Verify modals open instantly.

---

### 1.2 CRM & Lead Pipeline (`/crm` or `/leads`)

- [X] **Create New Lead**:
  - Click **"Add Lead"** / **"New Inquiry"**.
  - Fill details:
    - *Client Name*: `Rajesh & Priya Sharma`
    - *Event Type*: `Wedding Gala`
    - *Estimated Budget*: `₹15,00,000`
    - *Guest Count*: `450`
    - *Event Date*: Any date 2-3 months out.
  - Save and verify the lead card appears in the **"New / Inquiry"** column.
- [X] **Kanban Drag-and-Drop**:
  - Drag the lead card from **Inquiry** ➔ **Contacted** ➔ **Proposal Sent**.
  - Refresh the browser page (`F5`) and ensure the card **remains** in its new column (database persistence check).
- [X] **Lead Scoring**: Open the lead details and verify AI Lead Score (e.g., 85/100) displays based on budget and stage.

---

### 1.3 Smart Quotes & Digital Proposals (`/quotes`)

- [X] **Create Quote**:
  - Click **"Create Quote"** / **"New Proposal"**.
  - Select your created lead (`Rajesh & Priya Sharma`).
  - Add itemized line items:
    - *Catering & Buffet* (Qty: 450, Rate: ₹1,500) ➔ ₹6,75,000
    - *Floral Stage Décor* (Qty: 1, Rate: ₹3,50,000) ➔ ₹3,50,000
    - *Cinematic Photography & Drone* (Qty: 1, Rate: ₹2,00,000) ➔ ₹2,00,000
  - Verify **Subtotal**, **GST (18%)**, and **Grand Total** calculate automatically.
- [X] **Printable PDF Export**:
  - Click **"Download / Print PDF"**.
  - Verify a clean, professional invoice/quote document opens with your company branding and no visual overlap.
- [X] **Share Quote Link**:
  - Click **"Share Proposal"** / **"Copy Link"**.
  - Copy the generated URL (e.g., `http://localhost:3000/quotes/share/[token]` or `http://localhost:3000/portal/quotes?token=...`).
  - *Keep this URL saved for Phase 2 (Client Portal Testing)*.

---

### 1.4 Event Bookings & Timeline Manager (`/events`)

- [X] **Convert Quote to Booking**:
  - From the quote detail screen, click **"Convert to Active Booking"**.
  - Verify the status updates to `CONFIRMED` and a new event record is generated.
- [ ] **Run-of-Show Timeline Items**:
  - Open the event's **Timeline / Run-of-Show** tab.
  - Add milestones:
    - `08:00 AM` — Sound & Acoustic Ingress
    - `11:00 AM` — Mandap Floral Styling
    - `06:30 PM` — Guest Welcome & Baarat Assembly
  - Verify milestones order chronologically.
- [X] **AI Conflict Detection**:
  - Try adding a conflicting task with overlapping time and venue slot.
  - Verify EventOS highlights the scheduling conflict with an alert badge.

---

### 1.5 Finance, Invoices & Direct QR Settlements (`/finance` & `/invoices`)

- [X] **Milestone Invoicing**:
  - Generate a **Deposit / Advance Invoice** (e.g., 20% advance = ₹2,45,000).
  - Verify invoice number sequence format (e.g., `INV-2026-001`).
- [X] **0% Fee Direct Payment Destination**:
  - Open invoice payment preview.
  - Verify your agency's **UPI QR code** and **Bank Account details** render accurately for instant client UPI transfer.
- [X] **Mark Invoice as Paid**:
  - Click **"Record Payment"** / **"Mark Paid"** with method `UPI / Bank Transfer`.
  - Verify invoice status chips turn from `PENDING` ➔ `PAID` (Emerald badge).

---

### 1.6 Gallery & Media Delivery (`/gallery`)

- [X] **Create Album**:
  - Click **"New Album"**. Title: `Sharma Wedding - Highlights`.
  - Set a Client Access Passcode (e.g., `PRIYA2026`).
- [X] **Media Upload**:
  - Upload 2-3 sample wedding images.
  - Verify thumbnail rendering, image lightbox modal preview, and download buttons function cleanly.
- [X] **Secure Passcode Link**:
  - Copy the client album sharing link.

---

### 1.7 Settings Audit — Zero Mock Data Check (`/settings`)

Go through the settings sections to verify real persistence:

- [ ] **Workspace Home (`workspace`)**: Verify **Storage pool** shows real storage compute (`0.0 GB / 50 GB`) and tier displays your plan.
- [ ] **Company Profile (`company`)**: Verify changing Company Name and Address persists upon reload.
- [ ] **White-Label & Domain (`whitelabel`)**:
  - Click **"Choose Local File"** and upload your agency logo.
  - Select your primary brand color preset.
  - Click **"Save White-Label Theme"** and verify live preview updates.
- [ ] **Billing & Payment Destination (`billing`)**:
  - In **"Agency Owner Direct Payment Destination"**, enter your real UPI ID and Bank Account.
  - Click **"Save Direct Payment Details"** ➔ Verify toast and reload persistence.
  - In **"Registered Tax Profile & Billing Address"**, enter your business address and click **"Save Tax Profile & Billing Address"**.
- [ ] **WhatsApp Cloud API (`whatsapp`)**:
  - Test the **"Direct WhatsApp Preview & Sandbox Dispatch"** tool with your real mobile number.
- [ ] **Workspace Automations (`automations`)**:
  - Toggle an automation rule or click **"Create Workflow"**.
  - Refresh the page to verify it persists.

---

## 📱 PHASE 2: Client Portal (Real Client Experience)

Open an **Incognito Browser Window** (so you are not logged in as Agency Owner):

### 2.1 Accessing the Proposal Link

- [X] Paste the shared proposal link copied from Step 1.3 into the incognito window.
- [X] Verify the page loads cleanly with:
  - Your custom agency logo and brand colors (White-label styling).
  - Client name (`Rajesh & Priya Sharma`).
  - Itemized pricing breakdown with taxes and total.

### 2.2 Interactive Review & Digital Approval

- [X] Scroll through the proposal items.
- [X] Look for the prominent **"Accept & Approve Proposal"** button.
- [X] Click **"Accept Proposal"**:
  - Provide digital signature / name confirmation.
  - Click **Confirm Approval**.
  - Verify a celebration / success confirmation screen appears (`Status: APPROVED`).

### 2.3 Portal Timeline & Invoices

- [ ] Click **Timeline tab** in client portal: Verify read-only view of the event's milestones.
- [ ] Click **Invoices tab**: Verify client can view the pending/paid milestone invoice and click **"Print / Download Receipt"**.

### 2.4 Gallery Album Passcode Access

- [X] Open the shared album link in incognito mode.
- [X] Enter the passcode `PRIYA2026`.
- [X] Verify photos unlock and can be downloaded.

---

## 🛡️ PHASE 3: SuperAdmin Platform Console

Open `http://localhost:3000/superadmin/login`:

### 3.1 Zero-Trust Login

- [X] Enter:
  - **Email**: `admin@eventos.com`
  - **Password**: `admin123`
- [X] Click **"Authenticate Platform Session"**.
- [X] Verify you are logged into the **SuperAdmin Command Center** without "Email Unverified" errors.

### 3.2 Tenant Oversight & SaaS Governance (`/superadmin`)

- [ ] **Tenant Directory**:
  - Locate your agency tenant in the list.
  - View tenant usage (Users count, active events, storage consumption).
- [ ] **Subscription & Quota Management**:
  - Test changing a tenant's plan or toggling tenant status between `ACTIVE` and `SUSPENDED`.
- [ ] **Platform Audit Log**:
  - Inspect the security log to see recent login events, IP addresses, and actions.
- [ ] **Infrastructure Health**:
  - Check database status, container health, and API response metrics.

---

## 📋 Bug Reporting Template

Agar kisi step par error aaye ya UI break ho, is format mein note karein:

```markdown
### Bug Report
- **Module**: [e.g. CRM / Quotes / Client Portal]
- **Step**: [e.g. Step 1.3 - Clicking Accept Quote]
- **Expected Behavior**: [e.g. Quote should mark Approved and show success toast]
- **Actual Behavior**: [e.g. Red toast appears or button stays in loading state]
- **Console Error (if any)**: [F12 Console output]
-
```
