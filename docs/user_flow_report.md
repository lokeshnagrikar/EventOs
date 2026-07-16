# EventOS — User Flow & Journey Report

This document maps the complete system workflows, user roles, state transitions, and integration points between the Next.js frontend and the Spring Boot microservices.

---

## 1. System Actor Definitions

EventOS supports five core roles across two interface contexts (Workspace Console and Client Portal):

| Role | Interface | Description & Scope of Authority |
| :--- | :--- | :--- |
| **OWNER** | Console | Business creator. Holds full workspace authority, billing, subscription plan management, and deletion controls. |
| **ADMIN** | Console | Workspace administrator. Manages team invitations, system branding, settings, CRM leads, and quote approvals. |
| **MANAGER** | Console | Leads manager. Focuses on sales pipelines, converting leads, drafting quotes, and recording payments. |
| **STAFF** | Console | Operational coordinator. Views events, manages checklist tasks, run-of-show timelines, and logs vendor assignments. |
| **CLIENT** | Portal | Event customer. Views their event timeline, approves quotes, downloads PDF invoices, and reviews media galleries. |

---

## 2. Global Application Lifecycle Flow

The diagram below represents the journey of a user from initial landing through authentication, setup, core operations, and client collaboration:

```mermaid
graph TD
    Landing[1. Landing Page] -->|Register| Register[2. Company / Owner Registration]
    Register -->|Auth Service| Onboard[3. Welcome & Onboarding Wizard]
    Onboard -->|Configure Brand & Seeds| Dashboard[4. Workspace Console Dashboard]
    
    Dashboard -->|CRM Module| CRM[5. Lead & Quote Pipeline]
    Dashboard -->|Event Module| Operations[6. Event Execution & Checklist]
    Dashboard -->|Billing Module| Billing[7. Invoices & Payments Ledger]
    
    CRM -->|Approve Proposal| Portal[8. Client Portal Collaboration]
    Operations -->|Track Tasks| Portal
    Billing -->|Reconcile Payments| Portal
```

---

## 3. Core Module Workflows

### A. Authentication & Session Rotation Flow
Enforces secure stateless authorization via RS256 signed JWTs with automatic Refresh Token Rotation (RTR) and device session monitoring.

```mermaid
sequenceDiagram
    autonumber
    actor User as Web Client
    participant Gateway as API Gateway (8080)
    participant Auth as Auth Service (8081)
    participant Redis as Redis Session Cache

    User->>Gateway: POST /auth/login (credentials)
    Gateway->>Auth: Forward Credentials
    Auth->>Auth: Verify password (bcrypt)
    Auth->>Auth: Generate RS256 Access Token (15m)
    Auth->>Auth: Generate raw Refresh Token UUID
    Auth->>Redis: Store Session metadata & token hash
    Auth-->>User: Set HTTP-Only Refresh Token Cookie (SameSite=Strict, Path=/api/v1/auth/refresh)<br>Return Access Token in JSON payload

    Note over User, Gateway: Active Session (15m sliding window)
    User->>Gateway: GET /crm/leads (Bearer JWT)
    Gateway->>Gateway: Validate JWT Signature (RS256 Public Key)
    Gateway->>Gateway: Inject X-User-* headers
    Gateway-->>User: Return leads data (200 OK)

    Note over User, Gateway: Token Expiration & Silent Refresh
    User->>Gateway: GET /crm/leads (Expired JWT)
    Gateway-->>User: Return 401 Token Expired
    User->>Gateway: POST /auth/refresh (HTTP-Only Cookie attached)
    Gateway->>Auth: Forward Refresh Request
    Auth->>Redis: Verify presented Refresh Token hash
    Auth->>Auth: Generate NEW Access Token & NEW Refresh Token
    Auth->>Redis: Invalidate old token & register new token
    Auth-->>User: Set rotated Cookie & return new Access Token
```

---

### B. Onboarding & Workspace Configuration Flow
Executed on the first login of a newly registered workspace owner to seed workspace parameters and company settings.

```mermaid
stateDiagram-v2
    [*] --> SetupCompany : Onboarding Initialized
    SetupCompany --> UploadLogo : Input timezone, currency, & business address
    UploadLogo --> SeedDefaults : Upload brand assets to Cloudinary
    
    state SeedDefaults {
        [*] --> SeedPricing : Create default pricing structures
        SeedPricing --> SeedStatuses : Initialize lead pipeline stages
        SeedStatuses --> [*] : Seeding Completed
    }
    
    SeedDefaults --> InviteTeam : Option to add coordinators
    InviteTeam --> Ready : Launch Dashboard Workspace Console
    Ready --> [*]
```

---

### C. Sales Pipeline (Leads to Confirmed Booking)
Tracks the conversion pipeline from a raw budget estimation to a qualified lead, high-fidelity quote proposal, and final confirmed booking.

```mermaid
flowchart TD
    Calc[1. Budget Calculator] -->|Input parameters| SaveCalc[2. Save Estimate]
    SaveCalc -->|Promote| CRM_Lead[3. CRM Lead Registered]
    CRM_Lead -->|Generate Quote| Quote[4. Quote Proposal Drafted]
    
    Quote -->|Add line items & tax| SendQuote[5. Proposal Sent to Client]
    SendQuote -->|Client Portal Access| ClientPortal[6. Client Reviews Proposal]
    
    ClientPortal -->|Reject & Comment| QuoteRevis[7. Quote Revision Created]
    QuoteRevis --> SendQuote
    
    ClientPortal -->|Approve| ApproveQuote[8. Quote Accepted]
    ApproveQuote -->|Auto-provision| Booking[9. Confirmed Event Booking]
    Booking -->|Auto-notify| Team[10. Coordinators Assigned]
```

---

### D. Operational Run-of-Show & Tasks Flow
Controls day-of event execution timelines, coordinator checklists, and vendor management.

```mermaid
graph TD
    Booking[Booking Confirmed] -->|Initialize| Ros[Run-of-Show Timeline]
    Booking -->|Initialize| Checklist[Checklist Task Board]
    
    Ros -->|Add Milestones| Setup[Setup Milestone]
    Ros -->|Add Milestones| Reception[Reception Milestone]
    
    Checklist -->|Assign Staff| Tasks[Checklist Tasks]
    Tasks -->|Check Overdue| Alert[Overdue Task Alerts]
    
    Checklist -->|Log Vendors| Vendors[Vendor Assignments]
    Vendors -->|Attach invoice| Ledger[Vendor Contracts]
```

---

### E. Financial Ledger (Invoices & Payments)
Manages cash flow, invoice generation, payment logs, and outstanding balance reconciliation.

```mermaid
sequenceDiagram
    autonumber
    participant Console as Planner Dashboard
    participant Event as Event Service (8083)
    participant CRM as CRM Service (8082)
    actor Client as Client Portal

    Console->>Event: Post /invoices (billing particulars)
    Event->>Event: Map totals & generate unique invoice number
    Event->>Event: Create draft Invoice
    Console->>Event: Put /invoices/{id}/status (SENT)
    Event-->>Client: Email Dispatcher sends invoice notification

    Client->>Client: Open Invoice (Client Portal)
    Client->>Client: Make Payment (UPI, Cash, Bank Transfer)
    Console->>Event: POST /payments (Record Transaction)
    activate Event
    Event->>Event: Save Payment Record
    Event->>Event: Calculate paid vs outstanding balance
    alt Fully paid
        Event->>Event: Update Invoice Status -> PAID
        Event->>Event: Update Booking Status -> CONFIRMED
    else Partially paid
        Event->>Event: Update Invoice Status -> PARTIAL
    end
    Event->>CRM: Clear/Update Dashboard Cache Metrics
    Event-->>Console: Return updated transaction registry
    deactivate Event
```

---

### F. Impersonation Flow (Support Administration)
Allows support engineers to resolve configuration issues directly inside a tenant workspace without password sharing, governed by access audits.

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Support Admin
    participant AdminUI as Super Admin Console
    participant Auth as Auth Service
    participant Gateway as API Gateway
    participant Services as Microservices

    Agent->>AdminUI: Request Impersonation (User X, Tenant Y)
    AdminUI->>Auth: Validate MFA & Support privileges
    Auth->>Auth: Log SUPPORT_IMPERSONATION_STARTED
    Auth-->>AdminUI: Generate Impersonation JWT (15m expiration)
    
    Agent->>Gateway: API Requests with Impersonation JWT
    Gateway->>Gateway: Decode token, detect support claim
    Gateway->>Services: Inject X-Impersonated=true & X-Agent-ID headers
    
    Note over Services: Restrict sensitive write operations<br>(Refunds, Workspace deletion blocked)
    Services->>Services: Log audits with Support Agent ID context
    Services-->>Agent: Return Workspace context
```

---

## 4. State Machine Diagrams

### A. Quote/Proposal Lifecycle
```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Quote
    DRAFT --> SENT : Send to Client
    DRAFT --> [*] : Deleted
    
    SENT --> VIEWED : Client opens quote
    SENT --> REJECTED : Client declines quote
    
    VIEWED --> ACCEPTED : Client signs proposal
    VIEWED --> REJECTED : Client declines quote
    
    REJECTED --> DRAFT : Create New Revision (v2)
    ACCEPTED --> [*] : Converted to Booking (Read-Only)
```

### B. Event Lifecycle
```mermaid
stateDiagram-v2
    [*] --> PLANNING : Booking Created / Event Drafted
    PLANNING --> CONFIRMED : Deposit Paid / Quote Approved
    CONFIRMED --> IN_PROGRESS : Event Date Reached
    IN_PROGRESS --> COMPLETED : Event Concluded & Invoiced
    
    PLANNING --> CANCELLED : Client Cancel / Non-payment
    CONFIRMED --> CANCELLED : Client Cancel / Non-payment
    
    COMPLETED --> [*]
    CANCELLED --> [*]
```
