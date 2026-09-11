# 📜 Project Evolution History & Hardening Log

> **Chronological record of key architectural milestones, SRE hardening sessions, bug fixes, and feature implementations.**

---

## 1. Milestone Timeline

```
[ Inception ] ──► [ Core Microservices ] ──► [ Security & Multi-Tenancy ]
        │                       │                             │
        ▼                       ▼                             ▼
Mono-repo layout        Spring Cloud Gateway,         RSA256 JWT signing,
Docker Compose dev      Auth, CRM, Events, Gallery    TenantContext, BCrypt
        │                       │                             │
        ▼                       ▼                             ▼
[ Event Bus & WS ] ──► [ Database Hardening ] ──► [ Resend & Mobile Polish ]
        │                       │                             │
        ▼                       ▼                             ▼
RabbitMQ topic bus      Flyway V1 - V34               3D HTML email templates,
STOMP live presence     PostgreSQL 17 alignment       100svh mobile drawer fix
```

---

## 2. Detailed Engineering Milestones

### Phase 1: Foundation & Microservices Infrastructure
* Provisioned multi-container Docker development environment (`docker-compose.yml`) containing PostgreSQL 17, Redis 7.2, RabbitMQ 3.13, and 5 Spring Boot microservices.
* Configured `api-gateway` (Port 8080) with dynamic route predicates and global CORS policies.

### Phase 2: Multi-Tenancy & Cryptographic Security
* Established tenant isolation architecture with `tenant_id` foreign keys across all database tables.
* Implemented asymmetric RSA256 JWT token generation using `jwt_private.pem` and `jwt_public.pem`.
* Built multi-workspace tenant switching with immediate context refresh (`/api/v1/auth/switch-workspace`).

### Phase 3: Lead CRM & Interactive Proposals
* Created the CRM pipeline with drag-and-drop Kanban lead stages.
* Built the interactive proposal and quote calculator with live PDF generation and client digital acceptance.

### Phase 4: Event Logistics & Cloudinary Proofing Engine
* Built the run-of-show timeline cue sheet coordinator in `event-service`.
* Integrated Cloudinary in `gallery-service` for automatic dynamic watermark overlays on unpaid client photo galleries.
* Connected RabbitMQ consumer to remove watermarks automatically upon invoice payment confirmation.

### Phase 5: Database & Flyway Hardening
* Resolved migration conflicts across `auth_db`, `crm_db`, `event_db`, and `gallery_db`.
* Upgraded and standardized canonical pricing plans through `V34__standardize_canonical_pricing_plans.sql`.
* Fixed duplicate React key rendering issues in dashboard team list.

### Phase 6: Transactional Email Infrastructure (Resend SMTP Relay)
* Configured Resend SMTP relay (`smtp.resend.com:587`) using username `resend` and active API key in `.env`.
* Engineered 7 responsive, dark-mode 3D animated HTML email templates in [`EmailService.java`](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/service/EmailService.java) for verification OTPs, invitations, password resets, welcome notices, magic links, and billing receipts.
* Verified that Resend SMTP relay renders backend HTML directly without requiring dashboard templates.

### Phase 7: Mobile Navigation Responsiveness & Lenis Compatibility
* Diagnosed mobile navigation clipping where expanded `SOLUTIONS` and `RESOURCES` submenus could hide off-screen on small mobile viewports.
* Implemented `max-h-[calc(100svh-5.5rem)]` on the mobile menu drawer in [`Navbar.tsx`](file:///d:/EventOs/web/src/components/landing/Navbar.tsx) using **Small Viewport Height** (`100svh`) to prevent browser address bars from obscuring action buttons.
* Added `data-lenis-prevent`, `-webkit-overflow-scrolling: touch`, and `scrollbar-thin` to ensure fluid touch scrolling inside the drawer.
