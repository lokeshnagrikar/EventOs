# EventOS — Current Project State

> **Last updated:** 2026-09-26 (Post-SuperAdmin RBAC, Multi-Gateway & Cloudflare Hardening)

## Current Version / State

**FACT:**
- Frontend: `eventos-web` v1.0.0 (Next.js 15.0, React 19, Tailwind CSS, Zustand)
- Backend: `eventos-parent` v1.0.0 (Spring Boot 3.3.0, Java 21)
- Microservices: `api-gateway` (:8080), `auth-service` (:8081), `crm-service` (:8082), `event-service` (:8083), `gallery-service` (:8084)
- Production Domain: `https://eventosapp.in`
- Backend API Host: `https://api.eventosapp.in` (VPS 200.234.47.154)

## Implemented Modules

| Module | Status | Notes |
|---|---|---|
| Authentication (JWT RSA-256, OAuth, Magic Link, 2FA) | ✅ Complete | Stateless verification, refresh token in Redis |
| Multi-Tenant Workspace Engine | ✅ Complete | 1-click workspace switching, strict `tenant_id` DB scoping |
| SuperAdmin Operational Console (`/superadmin`) | ✅ Complete | 100% real DB wired, 12 controls, dynamic metrics, zero mocks |
| Platform RBAC Security | ✅ Complete | 6 platform roles + 5 workspace roles, `@PreAuthorize` guards |
| Multi-Gateway Billing (Stripe & Razorpay) | ✅ Complete | Global USD & domestic INR/UPI, checkout portals, receipts |
| Public Inquiries & Lead Pipeline | ✅ Complete | Landing, exit-intent, blog newsletter, founder email alerts |
| CRM (Leads, Contacts, Pipeline) | ✅ Complete | Drag-and-drop Kanban pipeline |
| Quotes/Proposals | ✅ Complete | Dynamic calculator, PDF export, client portal approval |
| Events & Run-of-Show Timelines | ✅ Complete | Multi-day logistics, stage cues, crew dispatch |
| Invoices & Payments Ledger | ✅ Complete | Sequential numbering, financial margin auditing |
| Media Gallery & Proofing | ✅ Complete | Cloudinary integration, dynamic watermarks |
| Email Infrastructure | ✅ Complete | Resend SMTP outbound + Cloudflare Email Routing inbound |
| Client Portal (`/portal`) | ✅ Complete | Tokenized client quote approval & milestone payments |
| Landing Page & Marketing | ✅ Complete | 26+ responsive sections, breathing aurora, PWA enabled |

## Deployment & Infrastructure State

| Component | Target / Provider | State | Configuration |
|---|---|---|---|
| Frontend Web | Vercel | ✅ Live | Next.js 15, edge routing, auto-deploy from `main` |
| Microservices Backend | Ubuntu VPS (`200.234.47.154`) | ✅ Live | Docker Compose, Spring Boot 3.3, Java 21 |
| Database | PostgreSQL 17 (Docker) | ✅ Healthy | Container `eventos-postgres`, Flyway migrations |
| Cache & Session | Redis 7.2 (Docker) | ✅ Healthy | Container `eventos-redis`, token blacklist & metrics |
| Message Bus | RabbitMQ 3.13 (Docker) | ✅ Healthy | Container `eventos-rabbitmq`, async event topics |
| DNS & DDoS Defense | Cloudflare | ✅ Active | Anycast DNS, Universal SSL, WAF protection |
| Email Routing | Cloudflare Email Routing | ✅ Active | `admin@eventosapp.in` -> founder Gmail forwarder |
| Transactional Email | Resend SMTP (`send.eventosapp.in`) | ✅ Active | AWS SES backed, 7 dark-mode 3D HTML templates |

## Database State

| Database | Service | Schema Management | Port |
|---|---|---|---|
| `auth_db` | `auth-service` | Flyway (V1–V41) | 5433 (mapped to 5432 internal) |
| `crm_db` | `crm-service` | Flyway (V1–V11) | 5433 (mapped to 5432 internal) |
| `event_db` | `event-service` | JPA / Hibernate | 5433 (mapped to 5432 internal) |
| `gallery_db` | `gallery-service` | JPA / Hibernate | 5433 (mapped to 5432 internal) |

