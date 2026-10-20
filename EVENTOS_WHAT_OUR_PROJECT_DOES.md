# 🌟 EventOS — What Exactly Our Project Does (Core Features & Real-World Capabilities)

> **Platform Name**: EventOS  
> **Official Website**: [https://www.eventosapp.in](https://www.eventosapp.in)  
> **Target Industry**: Indian Wedding Planners, Luxury Event Agencies, Corporate Production Houses, Concert Organizers, and Professional Event Photographers.  
> **Creator & Architect**: Lokesh Nagrikar  

---

## 1. What is EventOS in One Sentence?

**EventOS is the all-in-one operating system and CRM for event businesses that automates the complete lifecycle of an event — from the first inquiry call to quote calculation, digital proposal signing, stage cue coordination, milestone payments, and branded guest photo delivery.**

Instead of juggling 5 different apps (WhatsApp, Excel, Canva, Google Drive, and Trello), an agency runs their entire million-rupee business on **one unified screen**.

---

## 2. The 7-Stage End-to-End Workflow (How an Event Runs on EventOS)

Here is the exact journey of an event inside EventOS from start to finish:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  1. Lead Ingest │ ────> │ 2. Dynamic Quote│ ────> │ 3. Proposal &   │ ────> │ 4. Booking &    │
│  (Kanban CRM)   │       │    Calculator   │       │    Contract     │       │    Ledger Lock  │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                                       │
                                                                                       ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 7. Guest Photo  │ <──── │ 6. Operations   │ <──── │ 5. Run-of-Show  │ <──── │ 4b. Milestone   │
│    Gallery & ZIP│       │    Audit Trail  │       │    Stage Cues   │       │    Payments     │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

### Stage 1: Lead Capture & Kanban CRM (`/crm`)
* **What happens**: A client inquires about a wedding or corporate summit.
* **What EventOS does**:
  * Captures client contact, event date, venue, guest count, and estimated budget.
  * Organizes leads on an interactive **Kanban Board** with 7 lifecycle stages:
    `NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `QUALIFIED` $\rightarrow$ `PROPOSAL_SENT` $\rightarrow$ `NEGOTIATION` $\rightarrow$ `WON` $\rightarrow$ `LOST`.
  * Allows one-click stage drag-and-drop, priority flags (`HIGH`, `MEDIUM`, `LOW`), and coordinator assignments.
  * Side drawer allows planners to review conversation history, client notes, and meeting dates.

---

### Stage 2: Dynamic Budget & Quote Calculator (`/quote-calculator`)
* **What happens**: The planner needs to calculate pricing accurately without making costly math mistakes.
* **What EventOS does**:
  * Provides a line-item budget engine broken down by categories:
    - **Venue & Hospitality**
    - **Catering & F&B**
    - **Decor, Floral & Stage Production**
    - **Photography & Cinematography**
    - **Sound, Acoustics & Intelligent Lighting**
    - **Artist & Celebrity Management**
    - **Logistics, Generators & Bouncers**
  * Automatically calculates **18% GST / Taxes**, agency service commissions, client discounts, and gross profit margins in real time.

---

### Stage 3: Digital Proposal & Client Approval Portal (`/portal/[id]`)
* **What happens**: Planners send proposals to clients. Traditional agencies send clumsy PDFs that get ignored.
* **What EventOS does**:
  * Generates a sleek, interactive **Public Client Portal Link**.
  * The couple or corporate client opens the link on their mobile/laptop, reviews itemized services, picks optional add-ons, and clicks **"Approve & Execute Contract"**.
  * Features a **Digital E-Signature Pad** where the client signs directly on screen.
  * Upon signing, the lead is automatically marked as **WON** and converted into a **Confirmed Booking** in the database.

---

### Stage 4: Booking Workspace & Financial Ledger (`/bookings/[id]`)
* **What happens**: Tracking contract values, advance booking deposits, and installment schedules.
* **What EventOS does**:
  * Generates a dedicated Booking Record (`EVT-2026-000001`).
  * Displays a real-time **Financial Ledger Summary**:
    - **Total Contract Value**: e.g., ₹329,220
    - **Paid Balance**: e.g., ₹50,000
    - **Outstanding Cost**: e.g., ₹279,220
    - **Installment Progress Ring**: Cleared contract ratios (e.g., 15%).
  * **Collect Installment Payment**: Staff enters received amounts (UPI, Bank Wire, Cash) with 1 click, instantly updating balances and auto-promoting statuses from `PENDING` to `CONFIRMED`.
  * **Invoices Tab**: Generates formal tax invoices with due dates and statuses (`DRAFT`, `SENT`, `PAID`).

---

### Stage 5: Multi-Day Run-of-Show Stage Cues (`/events/[id]`)
* **What happens**: On event day, timing is critical. If the bride enters before the sound cue, the whole production is ruined.
* **What EventOS does**:
  * Breaks down the event across multiple days (Day 1: Mehendi & Sangeet, Day 2: Haldi & Wedding Ceremony, Day 3: Grand Reception).
  * Minute-by-minute **Stage Cue Sheets**:
    - *07:00 PM*: Sound check & acoustic frequency test.
    - *08:15 PM*: Groom vintage car entry $\rightarrow$ Firework pyros triggered.
    - *08:45 PM*: Bride royal walk $\rightarrow$ Dry ice fog + Romantic violin cue.
    - *09:30 PM*: Varmala exchange $\rightarrow$ Rose petal drop machine active.
  * **Resource Allocation**: Assigns specific sound engineers, photographers, venue coordinators, and logistics vehicles to each event slot.

---

### Stage 6: Immutable Operations Audit Trail
* **What happens**: Financial or schedule disputes between partners, staff, or clients.
* **What EventOS does**:
  * Every single action is permanently recorded in the database:
    - Who logged a payment (`nagrikarlokesh24468@gmail.com` logged ₹50,000 on 10/10/2026, 2:58 PM).
    - Who checked off a milestone (`50% Advance Booking Payment` toggled to COMPLETED).
    - Who promoted booking status.
  * Zero guesswork, 100% accountability.

---

### Stage 7: Client & Guest Photo Gallery with Table QR Codes (`/gallery` & `/share/[token]`)
* **What happens**: Delivering 5,000+ photos to clients and wedding guests without clumsy Google Drive links.
* **What EventOS does**:
  * **Fast Cloud Uploads**: High-res photos and videos upload directly to Cloudinary with real-time progress bars.
  * **Table QR Codes**: The system generates print-ready QR codes for dining tables.
  * **Guest Portal (`/share/[token]`)**:
    - Guests scan the QR code on their phones.
    - Enter a secure 4-digit PIN.
    - View albums, mark favorite pictures with heart icons, and stream highlight reels.
  * **High-Res Batch ZIP Downloads**: Guests or couples can download all their favorite photos in a single ZIP file with verified image integrity.

---

## 3. Core Feature Categories at a Glance

| Category | What EventOS Delivers |
| :--- | :--- |
| **CRM & Sales** | Visual Kanban pipeline, smart filters (priority, budget, date), client notes drawer, lead auto-capture. |
| **Quoting & Pricing** | Dynamic line-item calculator, 18% GST auto-calculation, profit margin protector, custom client add-ons. |
| **Contracts & Proposals** | Interactive web proposals, on-screen digital signatures, automatic contract PDF creation. |
| **Financial Ledger** | Total contract value, advance paid, balance dues, installment progress bars, live payment collection. |
| **Event Operations** | Multi-day itineraries, stage cues (sound, light, artist entries), crew and equipment allocation. |
| **Invoicing Engine** | Formal tax invoices, itemized subtotals, due date tracking, automated status tags. |
| **Media Proofing & Delivery**| Watermarked photo albums, client heart-favoriting, PIN-protected guest portals, table QR codes, ZIP downloads. |
| **AI Copilot** | Integrated floating assistant (`AiAssistant.tsx`) to answer event planning queries, review contracts, and assist staff. |
| **Security & Multi-Tenancy** | Multi-tenant tenant isolation (`tenant_id`), Role-Based Access Control (RBAC), JWT authentication, Redis session security. |
| **Superadmin HQ** | Global control plane to monitor agency tenants, platform subscriptions, and service health. |

---

## 4. Real-World Example: A ₹25 Lakh Wedding in Jaipur

To understand how EventOS changes an event planner's life, look at this real-world scenario:

| Without EventOS (Traditional Way) | With EventOS |
| :--- | :--- |
| Inquiry received on WhatsApp; forgotten after 3 days. | Inquiry auto-created in CRM; coordinator assigned with high-priority flag. |
| Quotation made in Excel; forgotten to include 18% GST, causing a ₹3,50,000 agency loss. | Dynamic Quote Calculator auto-applies GST, line items, and guarantees a 28% profit margin. |
| Proposal sent as a static PDF; client takes 2 weeks to print, sign, and scan. | Client opens interactive link on phone, picks decor add-ons, signs on screen in 2 minutes. |
| Advance payment received in cash/UPI; staff forgets who collected it, leading to client fights. | Payment logged in Ledger; balance drops to ₹15 Lakhs; audit trail records exact time and staff email. |
| Stage cues written on loose diary pages; sound guy plays wrong song during bride's entry. | Stage crew follows live digital Run-of-Show cues on their phones down to the exact second. |
| 4,000 photos dumped on Google Drive; guests struggle to download; links expire. | QR codes placed on guest tables; guests scan and view albums, favorite memories, and download ZIPs instantly. |

---

## 5. Summary: Why EventOS is a Game Changer

EventOS is not just a software; **it is an entire enterprise operating system**. It replaces:
1. **HubSpot / Pipedrive** (replaces with tailored Event CRM).
2. **Excel / Google Sheets** (replaces with Dynamic Quote Calculator).
3. **DocuSign / PandaDoc** (replaces with Digital Proposal E-Signatures).
4. **Asana / Trello** (replaces with Stage Cue Run-of-Show sheets).
5. **QuickBooks / Wave** (replaces with Event Financial Ledgers & Invoicing).
6. **Pixieset / Google Drive** (replaces with QR Code Guest Photo Galleries).

All unified under a modern, high-performance dark-mode interface built with Next.js 15, Spring Boot microservices, and PostgreSQL.
