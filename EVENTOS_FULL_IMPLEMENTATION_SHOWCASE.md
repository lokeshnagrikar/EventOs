# EventOS — Full System Implementation & Engineering Showcase

> **Project Name**: EventOS (The Modern Operating System for Event Agencies & Wedding Planners)  
> **Author & Founder**: Lokesh Nagrikar  
> **Production Live URL**: [https://www.eventosapp.in](https://www.eventosapp.in)  
> **API Gateway Endpoint**: `https://api.eventosapp.in/api/v1`  
> **Architecture Style**: Polyglot Distributed Microservices Architecture + Modern Next.js Edge Frontend  
> **Status**: 100% Fully Built, Production Hardened, Containerized & Live on VPS  

---

## 1. Executive Summary & Problem Solved

Traditional event management agencies, Indian wedding planners, and corporate production houses suffer from fragmented, disconnected tooling:
- **Lead tracking** is stuck in WhatsApp and Google Sheets.
- **Quotations and proposals** are manually drafted in Word/Excel, resulting in pricing errors and delay in closing clients.
- **Stage schedules and Run-of-Show cues** are maintained on printed papers with zero real-time sync across stage crews, sound engineers, and vendors.
- **Payment tracking** has no audit trail, causing disputes over advance deposits and balance dues.
- **Client photo/video delivery** relies on unbranded Google Drive or WeTransfer links with no client favoriting, watermarking, or branded proofing.

**EventOS** solves this by unifying the entire event lifecycle into a single, cohesive, multi-tenant enterprise platform.

---

## 2. High-Level Architecture & Tech Stack

```
                                [ Web Browser / Mobile PWA ]
                                             │
                                  HTTPS (Port 443 / WSS)
                                             ▼
                             ┌───────────────────────────────┐
                             │       Caddy Reverse Proxy     │
                             │  (Auto SSL / TLS Termination) │
                             └───────────────┬───────────────┘
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
┌─────────────────────────────────────┐             ┌─────────────────────────────────────┐
│       Next.js 15 Web Frontend       │             │       EventOS Spring API Gateway    │
│      (React 19, TypeScript,         │             │      (Spring Cloud Gateway, Netty)  │
│       Tailwind, Framer Motion)      │             │       Port: 8080 / Port: 443 API    │
└─────────────────────────────────────┘             └──────────────────┬──────────────────┘
                                                                       │
                         ┌──────────────────────┬──────────────────────┼──────────────────────┐
                         ▼                      ▼                      ▼                      ▼
              ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
              │    auth-service    │ │    crm-service     │ │   event-service    │ │  gallery-service   │
              │    (Port 8081)     │ │    (Port 8082)     │ │    (Port 8083)     │ │    (Port 8084)     │
              │  Tenant & User Auth│ │  Leads & Proposals │ │ Bookings & Cues    │ │ Media & Proofing   │
              └─────────┬──────────┘ └─────────┬──────────┘ └─────────┬──────────┘ └─────────┬──────────┘
                        │                      │                      │                      │
                        └──────────┬───────────┴───────────┬──────────┴──────────────────────┘
                                   │                       │
                                   ▼                       ▼
                     ┌───────────────────────────┐ ┌───────────────────────────┐
                     │     PostgreSQL 17+        │ │         Redis 7.2         │
                     │  (auth, crm, event,       │ │  (Distributed Caching,    │
                     │   gallery isolated DBs)   │ │   Rate Limit, Presence)   │
                     └───────────────────────────┘ └───────────────────────────┘
                                   │                       │
                                   ▼                       ▼
                     ┌───────────────────────────┐ ┌───────────────────────────┐
                     │       RabbitMQ 3.13       │ │     Cloudinary Media API  │
                     │  Async Events & Webhooks  │ │  Watermarked Proofing     │
                     └───────────────────────────┘ └───────────────────────────┘
```

### Complete Technology Stack Matrix:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, TanStack React Query v5, Zustand, Framer Motion, Lucide Icons, Canvas Confetti.
- **Backend**: Java 21, Spring Boot 3.3.2, Spring Cloud Gateway, Spring Data JPA / Hibernate 6, Spring Security 6, Spring WebSocket (STOMP).
- **Databases**: PostgreSQL 17+ with Flyway Database Versioning migrations per microservice.
- **Caching & Real-Time**: Redis 7.2 (token revocation, distributed cache, dashboard performance).
- **Messaging**: RabbitMQ 3.13 (AMQP event exchange).
- **Media Engine**: Cloudinary API (dynamic transformations, tiered quality, watermarked proofing, client ZIP packaging).
- **DevOps & Production**: Docker, Docker Compose, Linux VPS (`200.234.47.154`), Caddy reverse proxy with automatic Let's Encrypt SSL/TLS.

---

## 3. Microservices Breakdown & What Was Built

### 3.1 `api-gateway` (Spring Cloud Gateway • Port 8080)
- **Unified Reverse Proxy Routing**: Routes incoming requests to internal microservices cleanly:
  - `/api/v1/auth/**` $\rightarrow$ `auth-service:8081`
  - `/api/v1/crm/**` $\rightarrow$ `crm-service:8082`
  - `/api/v1/events/**` & `/api/v1/bookings/**` $\rightarrow$ `event-service:8083`
  - `/api/v1/gallery/**` $\rightarrow$ `gallery-service:8084`
- **WebSocket Upgrade Routing**: Proxies STOMP WebSockets (`/api/v1/auth/ws`) with handshake headers intact for real-time collaboration.
- **Cross-Origin Resource Sharing (CORS)**: Centrally managed security headers, pre-flight handling, and token forwarding.

---

### 3.2 `auth-service` (Authentication & Multi-Tenant Plane • Port 8081)
- **Multi-Tenant Architecture**: Every business tenant has its own isolated identifier (`tenant_id`), slug, settings, and workspace profile.
- **Secure Authentication**:
  - JWT Access Tokens & Refresh Tokens.
  - Role-Based Access Control (**RBAC**): `SUPERADMIN`, `OWNER`, `ADMIN`, `MEMBER`, `CLIENT`.
  - BCrypt password hashing.
- **Workspace Onboarding & Team Invites**:
  - Self-serve registration with instant agency workspace creation.
  - Email-based team member invitation with role assignment (`accept-invite`).
- **Real-Time Live Presence (WebSocket STOMP)**:
  - Broadcasts active team members, user presence, and typing indicators.
  - Redis session tracking.

---

### 3.3 `crm-service` (Lead Engine, Quotes & Proposals • Port 8082)
- **CRM Kanban Pipeline**:
  - Full lead lifecycle: `NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `QUALIFIED` $\rightarrow$ `PROPOSAL_SENT` $\rightarrow$ `NEGOTIATION` $\rightarrow$ `WON` $\rightarrow$ `LOST`.
  - Smart lead filtering by priority (`HIGH`, `MEDIUM`, `LOW`), event type (Wedding, Corporate, Concert), budget range, and assigned coordinator.
  - Lead drawer with activity timeline, client contact details, and notes.
- **Dynamic Interactive Quote Calculator**:
  - Line-item budget engine (Venue, Catering, Décor, Photography, Sound & Lights, Logistics).
  - Configurable GST / Tax computation, client discount margins, and profit margin analysis.
- **Digital Proposal Generator & Client Approval**:
  - Automatic proposal generation with unique public secure link.
  - Interactive client portal where couples/corporate clients review line items, select add-ons, and execute digital contract signatures.
  - 1-click conversion from won proposal directly into an active Event & Booking.

---

### 3.4 `event-service` (Operations, Financial Ledger & Cues • Port 8083)
- **Booking Workspace & Financial Ledger Summary**:
  - Master booking records with auto-generated identifiers (`EVT-2026-XXXXXX`).
  - Real-time financial ledger: **Total Contract Value**, **Paid Balance**, **Outstanding Cost**, and **Installment Progress Ratio (%)**.
  - Collect Installment Payment mechanism with instant balance re-calculation.
- **Operations & Run-of-Show Stage Cues**:
  - Multi-day event schedules (e.g., Sangeet, Mehendi, Wedding Ceremony, Reception).
  - Precise stage cue coordination: Sound check timings, acoustic cues, artist entry triggers, lighting presets.
- **Resource & Crew Allocation**:
  - Assignment of staff personnel, sound engineers, photographers, system equipment, and logistics vehicles to specific bookings.
- **Invoicing Engine**:
  - Generation of formal invoices with invoice numbers, line-item tax calculation, due dates, and payment states (`DRAFT`, `SENT`, `PAID`, `OVERDUE`).
- **Immutable Operations Audit Trail**:
  - Every financial transaction (`PAYMENT_COLLECTED`), lifecycle milestone change (`MILESTONE_ADDED`, `MILESTONE_TOGGLE`), status transition (`STATUS_CHANGE`), and staff allocation is permanently logged with timestamps and operator credentials.

---

### 3.5 `gallery-service` (High-Throughput Media Proofing Engine • Port 8084)
- **Media Album Management**:
  - High-resolution photo and 4K video albums grouped by event milestones.
  - Real-time Cloudinary direct upload integration with chunked upload and percentage progress feedback.
- **Client Favoriting & Proofing Engine**:
  - Clients can browse photo grids, mark favorites with heart tags, and leave frame-by-frame review comments.
- **PIN-Protected Public Guest Share Portals (`/share/[token]`)**:
  - Instant QR Code generation for guest tables.
  - Guests scan QR code to enter PIN and view event memories in real time.
- **High-Res Batch ZIP Downloads**:
  - Secure batch packaging into ZIP files with valid file extraction headers for both desktop and mobile devices.

---

## 4. Frontend Architecture & Web Application (Next.js 15)

The frontend is built with **zero external templates**, utilizing a bespoke modern aesthetic designed specifically for luxury agencies (dark mode palette, subtle glassmorphism, micro-animations, and responsive layout).

### Key Frontend Routes & Implemented Screens:
1. **Public Marketing & Pitch**:
   - `/`: High-converting landing page with 3D logo physics, live demo video showcase, interactive pricing calculator, and feature breakdowns.
   - `/tour`: Step-by-step interactive product tour.
   - `/calculator`: Standalone interactive event budget and margin estimation calculator.
   - `/pricing`: Transparent pricing tiers with feature matrix.
   - `/demo`: Interactive sandbox environment with sample data.
2. **Operations Dashboard & Workspaces**:
   - `/dashboard`: Executive command center with gross revenue, pipeline status, upcoming event timelines, and cashflow charts.
   - `/crm`: Full drag-and-drop Kanban lead board and smart filter drawers.
   - `/events`: Master calendar, event list, and multi-day Run-of-Show cue coordination.
   - `/bookings/[id]`: Comprehensive 6-tab Booking Ledger Workspace:
     - `Overview`: Contract execution status and digital agreement log.
     - `Timeline`: Run-of-show milestones with interactive toggle.
     - `Invoices`: Filtered billing invoices with payment status tags.
     - `Payments`: Dynamic transaction receipts derived from live audit ledgers.
     - `Resources`: Live team allocation and crew management.
     - `Audit Log`: Real-time operational audit trail.
   - `/gallery`: High-res album creation, upload progress bar, and QR code share modal.
   - `/invoices`: Master invoice generation and tracking dashboard.
   - `/settings`: Agency workspace branding, team member management, and profile controls.
3. **Public Client Experience**:
   - `/portal/[id]`: Interactive proposal approval, line-item review, and digital signature capture.
   - `/share/[token]`: Guest photo gallery, favorite selections, and batch ZIP download.
4. **AI Assistant & Copilot**:
   - Integrated floating Copilot (`AiAssistant.tsx` + `ProfessionalAiIcon.tsx`) with knowledge retrieval for event management workflows, contract guidance, and operational assistance.
5. **Superadmin Control Plane**:
   - `/superadmin`: Multi-tenant monitor to inspect active tenants, platform-wide metrics, system health, and subscription management.

---

## 5. Key Engineering Challenges Solved

### 1. Hibernate Foreign Key Mapping & 409 Conflict Elimination
- **Issue**: JPA `@OneToMany` with `@JoinColumn(name = "booking_id")` caused `null value in column "booking_id"` constraint violations when milestones were saved directly via child repository.
- **Resolution**: Refactored `BookingService.java` to manage milestones via parent aggregate root (`booking.getTimelineEvents().add(milestone)` and `bookingRepository.save(booking)`), letting Hibernate cascade the foreign key correctly with zero constraint failures.

### 2. Multi-Device Media Extraction (ZIP Downloads)
- **Issue**: Media album ZIP downloads on mobile and Windows occasionally extracted empty or corrupt image files due to stream piping headers.
- **Resolution**: Implemented multi-part chunk streaming in `gallery-service` that verifies image content types and constructs valid ZIP headers before writing stream buffers to the client.

### 3. Dynamic Audit-Backed Transaction Ledgers
- **Issue**: Ensuring transaction receipts in the Payments workspace remain 100% dynamic without mock data.
- **Resolution**: Built an audit parsing engine in `BookingDetailsWorkspace.tsx` that binds live `PAYMENT_COLLECTED` entries from `booking_audit_logs` directly to the ledger UI with staff attribution, timestamps, and rupee amounts.

### 4. Resilient Containerized Production Deployment
- **Issue**: Coordinating 5 microservices, Redis, PostgreSQL, RabbitMQ, and Next.js frontend on a single VPS without port conflicts or SSL certificate drops.
- **Resolution**: Built multi-stage Docker builds with Docker Compose internal networking (`eventos-net`), combined with Caddy reverse proxy for zero-touch automatic HTTPS renewals.

---

## 6. How to Run & Verify

### Running Locally (Docker Compose):
```bash
# Clone the repository
git clone https://github.com/lokeshnagrikar/EventOs.git
cd EventOs

# Start all databases and services
docker compose up -d
```

### Production Deployment (VPS):
```bash
cd /root/EventOs
git pull origin main
docker compose up -d --build
```

---

## 7. Project Ownership & Verification

- **Repository**: [https://github.com/lokeshnagrikar/EventOs](https://github.com/lokeshnagrikar/EventOs)
- **Architect & Full Stack Developer**: Lokesh Nagrikar
- **Production Server**: Ubuntu VPS (`200.234.47.154`)
- **Domain**: [https://www.eventosapp.in](https://www.eventosapp.in)
