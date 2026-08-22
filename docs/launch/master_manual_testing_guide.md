# 🧪 EventOS Master Manual Testing Guide (User & Super Admin Flows)

> Complete step-by-step walkthrough to test **100% of EventOS features** before launch — including standard agency user flows and Super Admin 20-tab workspace settings.

---

## ⚡ STEP 0: STARTUP SEQUENCE (Run All Services Locally)

### Option A: Using Docker (Simplest)
```powershell
cd d:\EventOs
docker-compose up -d
```

### Option B: Local Services (Without Docker)
1. **Frontend**: Running on `http://localhost:3000` (already running in terminal!)
2. **PostgreSQL**: Local port `5433`
3. **Backend Services** (Build once & run JARs):
   ```powershell
   cd d:\EventOs\backend
   mvn clean package -DskipTests

   # Run in separate terminals (load_env.ps1 first):
   java -jar auth-service/target/auth-service-1.0.0.jar     # Port 8081
   java -jar crm-service/target/crm-service-1.0.0.jar       # Port 8082
   java -jar event-service/target/event-service-1.0.0.jar   # Port 8083
   java -jar gallery-service/target/gallery-service-1.0.0.jar # Port 8084
   java -jar api-gateway/target/api-gateway-1.0.0.jar       # Port 8080
   ```

---

## 👤 TEST SUITE 1: Standard Agency User Flow (Planner Experience)

### 1. Account Registration & Onboarding
- [ ] Go to `http://localhost:3000`
- [ ] Click **"Start 14-Day Free Trial"**
- [ ] Enter:
  - **Full Name**: `Ananya Sharma`
  - **Agency Name**: `Grand Celebrations Studio`
  - **Email**: `ananya@grandcelebrations.in`
  - **Password**: `TestPass123!`
- [ ] Submit $\rightarrow$ Verify account is created & redirected to workspace dashboard.

### 2. CRM & Lead Management (Kanban Board)
- [ ] Go to Dashboard $\rightarrow$ **CRM & Leads**
- [ ] Click **"+ Add New Lead"**:
  - **Client Name**: `Raj & Simran Wedding`
  - **Event Type**: `Wedding (3 Days)`
  - **Budget**: `₹15,00,000`
  - **Event Date**: `15 Dec 2026`
  - **Stage**: `New Inquiry`
- [ ] Verify lead card appears in **New Inquiry** column.
- [ ] Drag lead card: **New Inquiry** $\rightarrow$ **Proposal Sent** $\rightarrow$ **Won**.
- [ ] Verify **AI Lead Score** displays `94/100` (High Probability).

### 3. Quote Generator & PDF Export
- [ ] Open lead: `Raj & Simran Wedding` $\rightarrow$ Click **"Create Quote"**
- [ ] Add Line Items:
  - `Grand Mandap & Floral Decor` — `₹3,50,000`
  - `Line Array Sound & LED Wall` — `₹1,20,000`
  - `Catering (500 guests @ ₹1,500/head)` — `₹7,50,000`
  - `Candid Photography & Cinematic Film` — `₹2,50,000`
- [ ] Verify **18% GST** is automatically calculated:
  - Subtotal: `₹14,70,000`
  - GST (18%): `₹2,64,600`
  - **Grand Total**: `₹17,34,600`
- [ ] Click **"Export PDF"** $\rightarrow$ Verify PDF downloads with line items & totals.
- [ ] Click **"Share via WhatsApp"** $\rightarrow$ Verify pre-filled summary opens.

### 4. Event Booking & Timeline Conflict Resolution
- [ ] Go to **Events & Bookings** $\rightarrow$ Select `Raj & Simran Wedding`
- [ ] Add Timeline Run-of-Show entries:
  - `08:00 AM - Stage & Trussing Setup`
  - `11:00 AM - Sound Check & Mic Testing`
  - `02:00 PM - Baraat Welcome & DJ`
- [ ] Add an overlapping entry intentionally:
  - `11:15 AM - Mandap Puja Setup`
- [ ] Verify **AI Conflict Alert** triggers: *"Warning: Sound Check overlaps with Mandap Setup. Suggested shift: 10:15 AM."*
- [ ] Click **"Auto-Resolve"** $\rightarrow$ Verify timeline updates with zero conflicts.

### 5. Media Gallery Delivery (Photo Proofing)
- [ ] Go to **Gallery & Media** $\rightarrow$ Click **"+ New Album"**
  - Album Name: `Raj & Simran Sangeet Night`
- [ ] Upload 3-5 JPG photos
- [ ] Set Passcode: `2026`
- [ ] Click **"Share Public Link"** $\rightarrow$ Copy URL
- [ ] Open Incognito Window $\rightarrow$ Open link $\rightarrow$ Enter passcode `2026`
- [ ] Verify high-res photos load instantly from Cloudinary CDN.

---

## 👑 TEST SUITE 2: Super Admin & Workspace Settings Flow

### 1. Login as Super Admin / Owner
- [ ] Go to `http://localhost:3000` $\rightarrow$ Click **Login**
- [ ] Credentials: `admin@eventos.agency` / `AdminPass123!`
- [ ] Verify **Super Admin Badge** is visible in top right avatar.

### 2. Multi-Tenant Workspace Selector
- [ ] Click top-left **Workspace Switcher Pill**
- [ ] Verify all registered tenant workspaces appear:
  - `Grand Celebrations Studio` (Active)
  - `Dream Weddings Studio` (Demo)
- [ ] Switch workspace $\rightarrow$ Verify UI updates context instantly.

### 3. 20-Tab Workspace Settings Console
Go to **Dashboard $\rightarrow$ Workspace Settings** and test each key tab:

| Tab # | Setting Name | Test Steps | Expected Result |
|:---|:---|:---|:---|
| **Tab 1** | **General Info** | Change Agency Name, Tagline | Updates header brand text |
| **Tab 2** | **Branding & Logo** | Upload custom PNG logo, pick accent color (`#7C3AED`) | UI elements re-theme |
| **Tab 3** | **Custom Domain** | Enter `events.grandcelebrations.in` | Shows CNAME DNS instructions |
| **Tab 4** | **Team & Members** | Invite new member: `rohit@agency.com` as "Coordinator" | Invite email sent, role assigned |
| **Tab 5** | **Roles & Permissions** | Toggle "Coordinator can view financial quotes" OFF | Coordinator account hides totals |
| **Tab 6** | **Invoicing & Taxes** | Enter GSTIN `07AAAAA0000A1Z5`, default GST rate 18% | Included on all exported quotes |
| **Tab 7** | **UPI & Payments** | Upload UPI QR Code + enter VPA `agency@upi` | Displays on client payment checkout |
| **Tab 8** | **Stripe / Razorpay** | Toggle Test Mode / Live API Keys | Verification success message |
| **Tab 9** | **WhatsApp Integration**| Connect Meta Cloud API token / Interakt key | Status changes to "Connected ✓" |
| **Tab 10**| **Email SMTP** | Configure SendGrid API key | Test email arrives in inbox |
| **Tab 11**| **AI Co-pilot Rules** | Set default lead scoring weights & auto-reminders | AI scores recalibrate |
| **Tab 12**| **Gallery Settings** | Set default album expiry (30 days), download permissions | Applied to all new albums |
| **Tab 13**| **Terms & Contract** | Edit default contract clause template | Pre-fills in new quotes |
| **Tab 14**| **Vendor Directory** | Add Vendor: `DJ Rock, 9876543210` | Available in timeline assignments |
| **Tab 15**| **Audit Logs** | View Activity Log table | Shows timestamped log of all recent actions |
| **Tab 16**| **Security & Sessions**| Click "Revoke All Other Sessions" | Logged out from other browsers |
| **Tab 17**| **Subscription Plan**| View current tier (Professional Plan) $\rightarrow$ Click Upgrade | Stripe portal opens |
| **Tab 18**| **Data Export** | Click "Export Workspace Backup (JSON/CSV)" | Full database dump downloads |
| **Tab 19**| **Webhooks Engine** | Add webhook URL: `https://hooks.zapier.com/...` | Fires test payload |
| **Tab 20**| **Danger Zone** | Check "Archive Workspace" button safety modal | Requires password confirmation |

---

## 📋 SUMMARY CHECKLIST BEFORE LAUNCH

- [ ] All 5 User Flow test cases PASSED
- [ ] All Super Admin & Settings test cases PASSED
- [ ] Zero errors in browser developer console (`F12`)
- [ ] All backend services respond `200 OK` on `/actuator/health`

**If all checkmarks are green — YOU ARE 100% READY FOR LIVE BETA LAUNCH! 🚀**
