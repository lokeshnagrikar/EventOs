# EventOS — Current Project State

> **Last updated:** 2026-09-21 (Brain initialization audit)

## Current Version / State

**FACT:**
- Frontend: `eventos-web` v1.0.0
- Backend: `eventos-parent` v1.0.0
- Spring Boot: 3.3.0
- Next.js: 15.x
- React: 19.0.0-rc

## Implemented Modules

| Module | Status | Notes |
|---|---|---|
| Authentication (JWT, OAuth, Magic Link, WhatsApp OTP, 2FA) | ✅ Complete | Auth-service fully functional |
| Workspace/Team Management | ✅ Complete | Multi-tenant with invitations |
| CRM (Leads, Contacts) | ✅ Complete | Pipeline management |
| Quotes/Proposals | ✅ Complete | With PDF, sharing, revisions |
| Events | ✅ Complete | Multi-day, venues, assignments |
| Bookings | ✅ Complete | Full lifecycle with event-driven creation |
| Invoices | ✅ Complete | Sequential numbering, history |
| Payments | ✅ Complete | Tracking with transactions |
| Vendors | ✅ Complete | Contracts, assignments, payments |
| Timeline/Tasks | ✅ Complete | Backend entities and service |
| Gallery/Albums | ✅ Complete | Cloudinary, share links |
| Billing/Subscriptions | ✅ Complete | Stripe + direct mode |
| Client Portal | ✅ Complete | Dedicated layout and routes |
| Superadmin | ✅ Complete | Platform management |
| Landing Page | ✅ Complete | 26+ sections |
| AI Assistant | ⚠️ Partial | UI exists, responses simulated |
| Automation | ⚠️ Partial | Routes exist, depth unclear |
| Chat | ⚠️ Partial | Route exists, minimal implementation |
| SMS Integration | ❌ Not implemented | Referenced in pricing only |
| Run-of-Show Dashboard | ❌ Not implemented | WhatsApp templates exist, no dedicated UI |

## Recently Completed Work

**UNKNOWN:** Cannot be determined from codebase alone without git history analysis.

## Active Work

**UNKNOWN:** Current development priorities not determinable from codebase state.

## Known Bugs

- JVM crash logs present in repository (hs_err_pid files) suggesting instability in event-service and crm-service
- No explicit bug tracker visible in the repository

## Blockers

- No migration system — schema changes require careful coordination
- Large single-file pages (138KB-218KB) impede development velocity

## Pending Decisions

- Whether to implement real LLM integration for AI assistant
- Whether to adopt a database migration tool
- Whether to decompose large page files

## Current Priorities

**UNKNOWN:** Cannot be determined without external context.

## Deployment State

| Component | State |
|---|---|
| Production domain | `eventosapp.in` / `api.eventosapp.in` |
| Alternative deployment | Render.com (detected in code) |
| Docker Compose | Fully configured for dev/staging/prod |
| Kubernetes | Manifests prepared, deployment status unknown |
| Monitoring | Prometheus + Grafana + Loki + Tempo configured |

## Database State

| Database | Service | Schema Management |
|---|---|---|
| auth_db | auth-service | Hibernate auto-DDL |
| crm_db | crm-service | Hibernate auto-DDL |
| event_db | event-service | Hibernate auto-DDL |
| gallery_db | gallery-service | Hibernate auto-DDL |
| payment_db | (unused) | Created but no service connects |

## Integration State

| Integration | Status |
|---|---|
| PostgreSQL | ✅ Active |
| Redis | ✅ Active |
| RabbitMQ | ✅ Active |
| Cloudinary | ✅ Active |
| Stripe | ✅ Active (with fallback) |
| SMTP/Email | ✅ Active (MailHog in dev) |
| Google OAuth | ✅ Active |
| WhatsApp API | ✅ Available (per-company config) |
| reCAPTCHA | ✅ Available |
| GA4/PostHog/Clarity | ⚠️ Optional (env-var gated) |

## UI State

- Landing page: Fully designed with premium effects (particles, 3D, glassmorphism)
- Dashboard: Functional but single 138KB file needs decomposition
- Settings: Functional but single 218KB file needs decomposition
- Client Portal: Complete with dedicated layout
- Design system: shadcn/ui + custom components, CSS variable theming
