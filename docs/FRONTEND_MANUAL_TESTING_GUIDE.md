# 🧪 EventOS Frontend Manual QA Testing & Verification Guide

This document provides a comprehensive step-by-step checklist to manually verify every UI component, page, form, modal, and interactive feature across the EventOS web platform.

---

## 📌 Prerequisites for Testing
1. **Frontend Dev Server**: Running on `http://localhost:3000` (`npm run dev`).
2. **Backend Microservices**: Running via `.\load_env.ps1` and Java processes (or Docker Compose).

---

## 📑 1. Landing Page & Global Navigation (`http://localhost:3000/`)

- [ ] **1.1 Navbar & Logo**:
  - Click on the **EventOS Logo** in top-left ➔ Verifies instant scroll/redirect to top of home page.
  - Hover over nav links (`Solutions`, `Resources`, `Pricing`, `Docs`) ➔ Smooth hover capsule highlight appears.

- [ ] **1.2 Multi-Tenant Workspace Selector Pill**:
  - Located on top-right of Navbar (displays `🏢 Apex Events & Production`).
  - Click the pill ➔ Glassmorphic dropdown menu opens.
  - Select `Royal Decorators & Scenography` ➔ Active workspace updates in 1 second with toast notification.
  - Click **Sign Out** inside the dropdown ➔ Opens the **Logout Confirmation Popup Modal**.

- [ ] **1.3 Mobile Navigation Drawer**:
  - Resize browser width `<640px` (or open Chrome DevTools Mobile View).
  - Click hamburger menu icon ➔ Solid dark drawer opens seamlessly.
  - Click `Solutions` or `Resources` ➔ Accordion sub-menu expands smoothly without backdrop text bleed-through.

- [ ] **1.4 Hero Section**:
  - Move mouse cursor over hero background ➔ Obsidian dot-matrix canvas spotlight follows cursor dynamically.
  - Click `Instant Quote Generator` button ➔ Navigates to `/quote-calculator`.
  - Click `Live Demo` button ➔ Opens demo preview drawer.

- [ ] **1.5 Interactive Components & Bento Grid**:
  - Scroll down to **Modules Bento Grid** ➔ Cards feature interactive hover borders.
  - **ROI Calculator Section**: Adjust event budget slider ➔ Calculates instant estimated annual savings.
  - **3D Testimonials**: Click testimonial cards to cycle through client reviews.

- [ ] **1.6 Live WhatsApp Notification Simulator Widget**:
  - Floating WhatsApp green badge button in bottom-right corner.
  - Badge counter displays unread count (e.g. `3`).
  - Click floating button ➔ Live Booking Dispatch drawer opens.
  - Click **"Test WhatsApp Dispatch"** button ➔ Audio chime triggers, new alert appears at top of stream with Toast notification.
  - Toggle **Live / Paused** simulation state button.

---

## 🔑 2. Authentication & Onboarding Modals (`AuthModal.tsx`)

- [ ] **2.1 Modal Triggering**:
  - Click `Sign In` or `Get Started` button in Navbar ➔ Backdrop blur darkens, Auth modal animates onto screen.
  - On mobile screens (`<640px`), modal transitions to a full-width bottom sheet (`max-h-[95vh]`).

- [ ] **2.2 1-Click Returning User Profile Card**:
  - If previous session exists, top card displays *"Welcome back, Lokesh Sharma! (Apex Events)"*.
  - Click **"Sign In with 1-Click"** ➔ Authenticates session instantly without re-entering password.

- [ ] **2.3 Email & Password Sign In**:
  - Type `john@gma` into email field ➔ Auto-suggestion pill `john@gmail.com` appears below input. Click pill to auto-fill.
  - Type non-business email (e.g. `user@yahoo.com`) ➔ Gentle nudge appears: *"Tip: Use your work email for team collaboration"*.
  - Click eye icon ➔ Toggles password visibility (dots vs plain text).

- [ ] **2.4 WhatsApp 6-Digit OTP Tab**:
  - Switch tab to **"WhatsApp OTP"**.
  - Enter phone number (e.g. `+91 98765 43210`) and click **Send WhatsApp OTP**.
  - Screen transitions to 6-digit PIN input view with countdown timer (`0:59`).
  - Type 6 digits ➔ Auto-verifies and logs in user.

- [ ] **2.5 Registration Tab**:
  - Switch tab to **"Create Workspace"**.
  - Type password ➔ Real-time password strength meter updates (Weak / Good / Strong).
  - Check **"I agree to Terms & Privacy"** checkbox.
  - Click **Register Workspace** ➔ Redirects to `/onboarding` or `/workspace-select`.

- [ ] **2.6 Logout Confirmation Popup Modal (`LogoutConfirmationModal.tsx`)**:
  - Click Logout button in Navbar, Workspace Pill, or Dashboard Sidebar.
  - Warning modal appears: *"Sign Out of EventOS? Are you sure you want to end your active session?"*.
  - Displays user profile & active tenant pill.
  - Click **Cancel** ➔ Modal closes, session remains active.
  - Click **Yes, Sign Out** ➔ Clears session cookies/storage, displays Toast, and redirects to home page (`/`).

---

## 🧮 3. Event Quote Calculator & Proposal Export (`http://localhost:3000/quote-calculator`)

- [ ] **3.1 Event Configuration**:
  - Select Event Category (`Wedding Reception`, `Concert / Festival`, `Corporate Gala`, `Private Party`).
  - Drag Guest Count Slider (50 ➔ 2,500 guests) ➔ Subtotal updates dynamically.

- [ ] **3.2 Service Add-ons**:
  - Toggle checkboxes for *Stage Scenography*, *Concert Sound & AV Rigging*, *4K Drone Photography*, *Gourmet Catering*.
  - Add custom line item (e.g., "Pyrotechnics", ₹45,000) ➔ Calculated into total cost.

- [ ] **3.3 Promo Code**:
  - Type `EVENTOS10` in promo code box and click **Apply** ➔ 10% discount badge applied.

- [ ] **3.4 PDF Proposal Preview**:
  - Click **Preview Proposal** button ➔ Official EventOS Proposal modal opens.
  - Click **Download Proposal PDF** ➔ Generates itemized PDF quote file.

---

## 🏢 4. Multi-Tenant Workspace Switcher (`http://localhost:3000/workspace-select`)

- [ ] **4.1 Workspace Grid**:
  - Displays cards for all user workspaces (`Apex Events & Production`, `Royal Decorators`, `Subhub Venues`).
  - Displays role badge (`OWNER`, `ADMIN`, `DIRECTOR`).

- [ ] **4.2 Switch Action**:
  - Click **Launch Workspace** on any card ➔ Switches active tenant context and opens `/dashboard`.

---

## 📊 5. Enterprise Dashboard & Finance Hub (`http://localhost:3000/finance`)

- [ ] **5.1 Financial Analytics & Margins Dashboard (`EventFinancialAnalytics.tsx`)**:
  - **KPI Cards**: Displays Total Gross Revenue (`₹48,50,000`), Vendor Expenses (`₹28,20,000`), Net Profit Margin (`₹20,30,000` / 41.9%), Unpaid Invoices.
  - **Monthly Area Chart**: Hover over chart data points to inspect monthly revenue vs. vendor expense trends.
  - **Cost Allocation Donut Chart**: Hover over pie segments (*Stage & Decor*, *Catering*, *Sound & AV*, *Cinematography*, *Crew*).
  - **Per-Event Profitability Table**: Audits events with client name, revenue, expenses, net profit, margin % pill (`45%`), and status badge (`Paid`, `Partial`, `Pending`).
  - **Currency Switcher**: Toggle `₹ INR`, `$ USD`, `€ EUR` ➔ All numbers format instantly.
  - **Export Action**: Click **Export Analytics** ➔ Toast confirms report download.

- [ ] **5.2 Dynamic UPI QR Payment Modal (`DynamicUpiQrModal.tsx`)**:
  - Click **Generate UPI QR Code** on an unpaid invoice.
  - Displays dynamic UPI QR Code, VPA ID (`eventos.pay@hdfcbank`), and countdown timer (`14:59`).
  - Click **Copy UPI ID** ➔ Copies to clipboard with toast alert.
  - Click **Verify Payment Status** ➔ Simulates real-time UPI transaction clearance.

---

## 📌 6. Dashboard Sidebar Navigation & Modules (`http://localhost:3000/dashboard`)

### 6.1 Workspace Category
- [ ] **Main Overview Dashboard (`/dashboard`)**:
  - Top Metric Cards (Total Revenue, Active Events, Total Clients, Conversion Rate).
  - Recent Bookings activity stream & Quick Action FAB.
- [ ] **AI Center (`/ai`)**:
  - Prompt input for AI Event Generator (e.g. *"Plan 500-guest Beach Wedding"*).
  - Generates instant vendor checklist, budget estimation, and timeline.
- [ ] **Workspace Chat (`/chat`)**:
  - Multi-user team chat channel (`#general`, `#logistics`, `#vendors`).
  - Send message ➔ Appears in chat thread with timestamp.
- [ ] **Activity Logs (`/activity`)**:
  - Displays real-time audit trail of user actions (login, contract signs, invoice payouts).

### 6.2 Operations Category
- [ ] **CRM / Lead Pipeline (`/crm`)**:
  - Kanban Board view with drag-and-drop stages (*New Lead*, *Contacted*, *Proposal Sent*, *Won*, *Lost*).
  - Click **Add Lead** ➔ Lead modal opens.
- [ ] **Events & Calendar (`/events`)**:
  - Interactive Month/Week/Day event calendar view.
  - Click an event ➔ Opens Run-of-Show timeline modal.
- [ ] **Bookings Management (`/bookings`)**:
  - Active venue & vendor bookings list with filter by status (`Confirmed`, `Pending Deposit`, `Completed`).
- [ ] **Media Gallery (`/gallery`)**:
  - Event photo booth masonry grid & EXIF Lightbox metadata modal.

### 6.3 Finance Category
- [ ] **Quotes (`/quotes`)**:
  - List of generated client proposals & quotes. Click to view PDF.
- [ ] **Finance Hub & Profit Margins (`/finance`)**:
  - Real-time revenue vs expense area charts, cost allocation donut, per-event profitability audit table (`EventFinancialAnalytics.tsx`).
- [ ] **Payments (`/payments`)**:
  - Payment transaction history ledger (UPI, Stripe, NetBanking, Cash).
- [ ] **Invoices (`/invoices`)**:
  - Invoice generation, PDF export, dynamic UPI QR modal (`DynamicUpiQrModal.tsx`).
- [ ] **Budget Calculator (`/calculator`)**:
  - Event cost estimation calculator with line-item breakdown.

### 6.4 Intelligence & Automation Category
- [ ] **Reports & Analytics (`/reports`)**:
  - Monthly revenue growth, client acquisition, and staff performance metrics.
- [ ] **Smart Automation Engine (`/automation`)**:
  - Visual workflow builder (e.g., *Trigger: New Lead ➔ Action: Send WhatsApp Confirmation & Create Task*).
- [ ] **Data Import (`/import`)**:
  - CSV / Excel lead & vendor data importer with field mapping preview.

### 6.5 System & Portals
- [ ] **Client Portal (`/portal`)**:
  - Client-facing dashboard where event clients view event timeline, pay invoices, and sign contracts.
- [ ] **Developer Center (`/developer`)**:
  - REST API specifications, Swagger UI, and Webhooks API key generator.
- [ ] **Help Center (`/help`)**:
  - Knowledge base articles & search helper (`HelpSearch.tsx`).

---

## ⚙️ 7. Settings Hub & Administration Menus (`http://localhost:3000/settings`)

- [ ] **7.1 General Workspace Profile**:
  - Edit Workspace Name (e.g., `Apex Events & Production`).
  - Upload Business Logo (PNG/JPEG) ➔ Verifies image thumbnail updates.
  - Change Default Currency (`₹ INR`, `$ USD`, `€ EUR`) and Timezone (`Asia/Kolkata - IST`).
  - Input Tax / GSTIN ID (e.g. `27AAAAA0000A1Z5`) ➔ Click **Save General Settings** (Toast notification confirms update).

- [ ] **7.2 Team Members & Access Control**:
  - Navigate to **Team** tab inside Settings.
  - Click **Invite Member** button ➔ Invite modal opens.
  - Type member email (`rahul@apexevents.com`) and select Role (`EVENT_MANAGER`).
  - Click **Send Invitation** ➔ Member added to pending invites table.
  - Click **Revoke Access** on an active member ➔ Confirmation dialog prompts.

- [ ] **7.3 Billing, Subscriptions & Quotas**:
  - Navigate to **Billing** tab inside Settings.
  - Current Active Plan displays badge (`STARTER`, `PRO`, or `ENTERPRISE`).
  - View Quota Usage Progress Bars (*Events used*, *Storage used*, *AI Credits*, *Gallery Uploads*).
  - Click **Upgrade Plan** ➔ Opens Plan Selection Modal (Stripe Checkout flow).
  - Click **Download Invoice PDF** in recent billing invoices table.

- [ ] **7.4 Custom White-Label Branding (`WhiteLabelSettings.tsx`)**:
  - Navigate to **White-Label & Domain** settings tab.
  - Type Custom Domain (e.g. `events.apexevents.com`) and click **Verify DNS**.
  - Badge updates to `DNS Verified` or `Pending CNAME Record`.
  - Toggle **Enable White-Label Email Sender** (e.g., `notifications@apexevents.com`).

- [ ] **7.5 Payment Gateway Integration Engine (`PaymentEngineSettings.tsx`)**:
  - Navigate to **Payment Gateways** tab.
  - Input Stripe Test / Live Keys (`pk_test_...` / `sk_test_...`).
  - Input UPI VPA Merchant ID (`eventos.pay@hdfcbank`).
  - View Live Webhook status indicator (`Status: Connected`).

- [ ] **7.6 WhatsApp Business API Integration (`WhatsAppApiSettings.tsx`)**:
  - Navigate to **WhatsApp Integration** tab.
  - Input WhatsApp Phone Number ID & Access Token.
  - Preview Approved WhatsApp Template Cards (*Booking Confirmation*, *Payment Reminder*, *Staff Dispatch*).
  - Toggle **Auto-Reply Bot Agent** switch.

- [ ] **7.7 Security, 2FA & Active Sessions (`/settings/security`)**:
  - Navigate to `/settings/security`.
  - Type Current Password, New Password, Confirm Password ➔ Click **Update Password**.
  - Toggle **Two-Factor Authentication (2FA)** ➔ TOTP QR Code setup modal displays.
  - Click **Sign Out All Devices** ➔ Triggers session invalidation.

---

## ✅ Test Execution Summary Matrix

| Module | Feature Tested | Pass / Fail | Notes |
| :--- | :--- | :--- | :--- |
| **Landing** | Navbar & Mobile Drawer | [ ] Pass | |
| **Landing** | Workspace Selector Pill | [ ] Pass | |
| **Landing** | WhatsApp Alert Simulator | [ ] Pass | |
| **Auth** | Returning User 1-Click | [ ] Pass | |
| **Auth** | Email Auto-Suggest | [ ] Pass | |
| **Auth** | WhatsApp 6-Digit OTP | [ ] Pass | |
| **Auth** | Logout Confirmation Modal | [ ] Pass | |
| **Calculator** | PDF Proposal Generator | [ ] Pass | |
| **Finance** | Profit Margins Analytics | [ ] Pass | |
| **Finance** | Dynamic UPI QR Modal | [ ] Pass | |
| **Dashboard** | Overview KPIs & Activity Feed | [ ] Pass | |
| **Dashboard** | AI Event Center (/ai) | [ ] Pass | |
| **Dashboard** | Workspace Chat (/chat) | [ ] Pass | |
| **Operations** | CRM Kanban Board (/crm) | [ ] Pass | |
| **Operations** | Events Calendar (/events) | [ ] Pass | |
| **Operations** | Bookings Management (/bookings) | [ ] Pass | |
| **Intelligence**| Smart Automation Engine (/automation) | [ ] Pass | |
| **System** | Client Portal (/portal) | [ ] Pass | |
| **System** | Developer Center (/developer) | [ ] Pass | |
| **Settings** | General Profile & Logo | [ ] Pass | |
| **Settings** | Team Invites & Permissions | [ ] Pass | |
| **Settings** | Billing & Plan Upgrades | [ ] Pass | |
| **Settings** | White-Label & Custom Domain | [ ] Pass | |
| **Settings** | Payment Gateway Keys | [ ] Pass | |
| **Settings** | WhatsApp API & Templates | [ ] Pass | |
| **Settings** | Security & 2FA Setup | [ ] Pass | |

