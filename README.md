# 🎪 EventOS — Enterprise Operating System for Events & Agencies

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Executive Summary

**EventOS** is an all-in-one, multi-tenant enterprise operating system built explicitly for event planning agencies, wedding coordinators, concert producers, and venue operators.

It unifies client lead management, instant quote calculations, 1-click proposal PDF generation, run-of-show stage timelines, financial margin auditing, WhatsApp notification automation, and media photo booth galleries into a single high-performance platform.

---

## 🧠 Project Knowledge Base (`brain/`)

EventOS maintains an authoritative, persistent knowledge base in the [`brain/`](brain/README.md) directory. This serves as the single source of truth for architecture, APIs, data models, and engineering rules:

| Guide | Description | Link |
|---|---|---|
| **Orientation** | Master Project Context & Tech Stack Overview | [`brain/00-project-context.md`](brain/00-project-context.md) |
| **Product Overview** | Vision, Personas, User Journeys & Modules | [`brain/01-product-overview.md`](brain/01-product-overview.md) |
| **Architecture** | Microservices Topology, Gateway & Message Bus | [`brain/02-architecture.md`](brain/02-architecture.md) |
| **Codebase Map** | Complete File & Directory Map | [`brain/03-codebase-map.md`](brain/03-codebase-map.md) |
| **Feature Inventory** | Status of Every Core Feature (Live vs Planned) | [`brain/04-feature-inventory.md`](brain/04-feature-inventory.md) |
| **Routes & APIs** | Complete Frontend & Backend API Catalog | [`brain/05-routes-and-api.md`](brain/05-routes-and-api.md) |
| **Data Model** | Multi-Database Schemas, Relations & Migrations | [`brain/06-database-and-data-model.md`](brain/06-database-and-data-model.md) |
| **Security & Auth** | RSA-256 JWT, RBAC & Tenant Context | [`brain/07-authentication-and-authorization.md`](brain/07-authentication-and-authorization.md) |
| **Design System** | Obsidian Theme, Color Tokens, Animations | [`brain/08-ui-design-system.md`](brain/08-ui-design-system.md) |
| **Workflows** | End-to-End Business Flow Blueprints | [`brain/09-user-workflows.md`](brain/09-user-workflows.md) |
| **Integrations** | Stripe, Cloudinary, WhatsApp, SMTP, PostHog | [`brain/10-integrations.md`](brain/10-integrations.md) |
| **Deployment** | Docker Compose, Caddy, Kubernetes & Env Vars | [`brain/11-deployment-and-environment.md`](brain/11-deployment-and-environment.md) |
| **Business Logic** | Tenancy Isolation Rules & Calculation Machines | [`brain/12-business-logic.md`](brain/12-business-logic.md) |
| **Tech Debt** | Prioritized Technical Debt, Bugs & Hardening | [`brain/13-known-issues-and-technical-debt.md`](brain/13-known-issues-and-technical-debt.md) |
| **Dev Rules** | Non-Negotiable Architecture & Coding Standards | [`brain/14-development-rules.md`](brain/14-development-rules.md) |
| **Living State** | Module-by-Module Health & Deployment State | [`brain/15-current-project-state.md`](brain/15-current-project-state.md) |
| **Future Roadmap** | Codebase-Evidenced Expansion Horizons | [`brain/16-future-roadmap.md`](brain/16-future-roadmap.md) |

👉 **[Browse Full Knowledge Base Master Index](brain/README.md)**

---

## ✨ Key Feature Highlights

### 🏢 Multi-Tenant Workspace Engine
- **1-Second Workspace Switcher** (`WorkspaceSelectorPill.tsx`): Agency owners managing multiple brand identities can toggle workspace contexts instantly without re-authenticating.
- **Strict Data Isolation**: Enforces tenant-isolated PostgreSQL database scoping (`tenant_id = :tenantId`) across every entity.
- **Superadmin Control Plane** (`/superadmin`): System-wide tenant provisioning, plan management, automated database backups (`BackupService`), platform audit logging, and system health metrics.

### 🔑 Frictionless Authentication & Security
- **Asymmetric RSA-256 JWT**: Secure token minting via `auth-service` and stateless public-key verification across the API Gateway and microservices.
- **Returning User Profile Card**: Recognizes browser sessions for 1-click sign-in.
- **Email Domain Auto-Suggestion**: Real-time domain completion (`name@gma` ➔ `name@gmail.com`) to eliminate signup typos.
- **Two-Factor Authentication (TOTP)**: Built-in 2FA support with Google Authenticator / Authy.
- **Granular RBAC**: Role-based access control with platform superadmin roles (`SUPER_ADMIN`, `SUPPORT_AGENT`, `BILLING_ADMIN`, `AUDITOR`) and tenant-scoped roles (`OWNER`, `ADMIN`, `MANAGER`, `COORDINATOR`, `CLIENT`).

### 📊 Financial Analytics & Margin Auditing
- **Live Profit Analytics Dashboard** (`EventFinancialAnalytics.tsx`): Real-time tracking of Gross Revenue, Production Costs, and Net Profit Margins.
- **Interactive Charts**: Monthly revenue vs. expense trends (Recharts AreaChart) and expense breakdown (Recharts Donut).
- **Per-Event Profit Audit Table**: Audits net profitability and margin % per event contract.
- **Multi-Currency Engine**: 1-Click toggle between `₹ INR`, `$ USD`, and `€ EUR`.
- **Dynamic UPI QR Payment Modal** (`DynamicUpiQrModal.tsx`): Instant UPI QR payments with 15-minute countdown and VPA copy helper.

### 🧮 Instant Quote & Proposal PDF Generator
- **Event Budget Calculator** (`/quote-calculator`): Interactive cost calculator with guest sliders (50 to 5,000 guests) and custom add-on line items.
- **1-Click Proposal PDF Export**: Compiles itemized event costs into downloadable client proposal PDFs.
- **Client Portal Approval** (`/portal`): Tokenized client access to review quotes, accept proposals, and make milestone payments.

### 🎪 Operations & Run-of-Show Stage Manager
- **Run-of-Show Stage Cue Sheets**: Real-time stage timelines for sound, lighting, pyrotechnics, and crew dispatch.
- **CRM Kanban Lead Pipeline** (`/crm`): Drag-and-drop lead stages (*New Lead* ➔ *Contacted* ➔ *Quote Sent* ➔ *Won* ➔ *Lost*).
- **Vendor & Budget Tracking**: Centralized database of vendors, contracts, and budget allocations.

### 📸 Media Photo Booth & Gallery Engine
- **Cloudinary CDN Integration**: High-speed photo uploads with automated thumbnail generation and EXIF metadata extraction.
- **PIN-Protected Client Albums**: Shareable gallery links with optional download limits and PIN security.

---

## 🏛️ System Architecture & Tech Stack

```
[ Client Browser ]
        │ (HTTPS / WSS)
        ▼
[ Caddy / Nginx Reverse Proxy ]
        │
        ▼
[ Spring Cloud API Gateway (:8080) ]
  ├── JWT RSA-256 Stateless Auth Filter
  ├── Dynamic Tenant Resolver
  ├── Rate Limiter (Redis)
  └── Microservice Routing
        │
 ┌──────┼──────────────┬──────────────┬──────────────┐
 ▼      ▼              ▼              ▼              ▼
[web] [auth-service] [crm-service] [event-service] [gallery-service]
:3000     :8081          :8082          :8083          :8084
 │        │              │              │              │
 │        ▼              ▼              ▼              ▼
 │    [auth_db]       [crm_db]      [event_db]    [gallery_db]
 │     (PostgreSQL 17 — Port 5433 / Schema per Service / Flyway Migrations)
 │
 └────────────────► [ RabbitMQ Event Bus (:5672) ]
                         ▲
                         └── Notification & Webhook Listeners
```

### Microservices Matrix

| Service | Port | Database | Migrations | Primary Responsibility |
|:---|:---:|:---|:---:|:---|
| **`web`** | 3000 | — | — | Next.js 15 App Router, React 19, Tailwind CSS, Zustand |
| **`api-gateway`** | 8080 | — | — | Spring Cloud Gateway, JWT RSA Verification, Rate Limiting |
| **`auth-service`** | 8081 | `auth_db` | Flyway (V1–V41) | Users, Tenants, Subscriptions, Stripe Billing, 2FA, Superadmin |
| **`crm-service`** | 8082 | `crm_db` | Flyway (V1–V11) | Leads, Contacts, Quotes, Proposals, Pipeline |
| **`event-service`** | 8083 | `event_db` | JPA / Hibernate | Events, Timeline, Stage Cues, Vendors, Invoices |
| **`gallery-service`** | 8084 | `gallery_db` | JPA / Hibernate | Albums, Photos, EXIF Metadata, Cloudinary Uploads |

---

## 📂 Repository Directory Structure

```
EventOs/
├── backend/                  # Java 21 / Spring Boot 3.3 Microservices
│   ├── api-gateway/          # Spring Cloud Gateway (Port 8080)
│   ├── auth-service/         # Authentication & Tenancy Service (Port 8081)
│   ├── crm-service/          # CRM, Quotes & Proposals Service (Port 8082)
│   ├── event-service/        # Event Operations & Timeline Service (Port 8083)
│   ├── gallery-service/      # Media & Photo Gallery Service (Port 8084)
│   └── common/               # Shared DTOs, Security Utils & Tenant Context
├── web/                      # Next.js 15 Frontend Web Application (Port 3000)
│   ├── src/
│   │   ├── app/              # App Router Pages & Route Groups
│   │   ├── components/       # UI, Auth, Dashboard, CRM, Event Components
│   │   ├── lib/              # API Client, Token Manager, Utils
│   │   └── store/            # Zustand State Stores
├── brain/                    # Master Project Knowledge Base & AI Memory
│   ├── decisions/            # Architecture, Product & Design Decisions
│   ├── sessions/             # Development Session Logs
│   └── 00..16-*.md           # 17 Core Domain Documentation Files
├── docker/                   # Docker environment manifests
├── docker-compose.dev.yml    # Development stack (PostgreSQL, Redis, RabbitMQ, Mailhog)
├── docker-compose.prod.yml   # Production stack (Caddy SSL reverse proxy, tuned JVM heaps)
├── docker-compose.yml        # Full containerized local development stack
├── load_env.ps1              # Local Environment Variable Loader (PowerShell)
├── Caddyfile                 # Production reverse proxy configuration
└── README.md                 # Project Overview & Quickstart Guide
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v20.x or v22.x
- **Java OpenJDK**: v21
- **Maven**: v3.9.x
- **Docker & Docker Compose**: Recommended for database and messaging infrastructure

### 1. Clone & Environment Configuration

```bash
git clone https://github.com/lokeshnagrikar/EventOs.git
cd EventOs

# Windows PowerShell: Load local development environment variables
.\load_env.ps1
```

### 2. Start Infrastructure Dependencies (Fast Local Dev)

To start only PostgreSQL, Redis, RabbitMQ, and MailHog in Docker while running application code on host:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Build & Run Backend Microservices

```bash
# Build all backend services from root
cd backend
mvn clean package -DskipTests
cd ..

# Run services (in separate terminal windows or as background processes):
java -Xmx128m -jar backend/api-gateway/target/api-gateway-1.0.0.jar
java -Xmx128m -jar backend/auth-service/target/auth-service-1.0.0.jar
java -Xmx128m -jar backend/crm-service/target/crm-service-1.0.0.jar
java -Xmx128m -jar backend/event-service/target/event-service-1.0.0.jar
java -Xmx128m -jar backend/gallery-service/target/gallery-service-1.0.0.jar
```

### 4. Run Next.js Frontend

```bash
cd web
npm install
npm run dev
```

The web application will be available at **`http://localhost:3000`**.

---

## 🐳 One-Command Production Launch

To spin up the entire production-grade stack (Frontend, Gateway, all 4 Backend Microservices, PostgreSQL, Redis, RabbitMQ, and Caddy Reverse Proxy):

```bash
# Start all containers in detached mode with automated build
docker-compose -f docker-compose.prod.yml up -d --build

# Check container health and status
docker-compose -f docker-compose.prod.yml ps

# View unified application logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🧪 API Testing Suites

Pre-configured API collections and environments are provided in the repository root:
- **Postman**: [`eventos_api_tests.postman_collection.json`](eventos_api_tests.postman_collection.json) & [`eventos_postman_environment.json`](eventos_postman_environment.json)
- **Bruno**: [`eventos_bruno_environment.bru`](eventos_bruno_environment.bru)
- **Hoppscotch**: [`eventos_hoppscotch_environment.json`](eventos_hoppscotch_environment.json)
- **Thunder Client**: [`eventos_thunder_environment.json`](eventos_thunder_environment.json)

---

## ⚙️ Key Environment Variables

| Variable | Default (Dev) | Description |
|---|---|---|
| `POSTGRES_PORT` | `5433` | Host port for PostgreSQL instance |
| `POSTGRES_USER` | `eventos_admin` | Database root user |
| `POSTGRES_PASSWORD` | `eventos_secret_2026` | Database user password |
| `JWT_SECRET` | *(Configured in env)* | Base64-encoded secret for JWT signature |
| `REDIS_HOST` | `localhost` | Redis caching instance host |
| `RABBITMQ_HOST` | `localhost` | RabbitMQ message broker host |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | API Gateway endpoint for frontend |
| `CLOUDINARY_CLOUD_NAME` | *(Optional in Dev)* | Cloudinary account name for media gallery |
| `STRIPE_SECRET_KEY` | *(Optional in Dev)* | Stripe API key for billing subscriptions |

---

## 📜 Engineering & Development Rules

1. **Strict Tenancy Scoping**: Never write a query without scoping by `tenantId`. Inter-tenant data leakage is a critical security failure.
2. **Microservices Boundary**: Never execute cross-database joins. Inter-service data sharing must occur via REST endpoints or RabbitMQ asynchronous events.
3. **Stateless Gateway**: The API Gateway validates tokens statutorily and forwards user context headers (`X-User-Id`, `X-Tenant-Id`, `X-User-Roles`) to downstream services.
4. **No Direct Secret Commits**: Never commit actual API keys or secrets. Always use environment variables.

For the complete rules handbook, consult [`brain/14-development-rules.md`](brain/14-development-rules.md).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
