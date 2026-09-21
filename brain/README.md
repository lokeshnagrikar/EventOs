# 🧠 EventOS Master Brain & Knowledge Base

Welcome to the **EventOS Project Brain**. This directory serves as the persistent, long-term source of truth for the entire EventOS platform — covering product vision, microservices architecture, frontend specifications, database schemas, integrations, technical debt, and operational guides.

---

## 📑 Core Documentation Index

| # | Document | Scope & Purpose |
|---|---|---|
| **00** | [`00-project-context.md`](file:///d:/EventOs/brain/00-project-context.md) | **Primary AI orientation doc** — core facts, problems solved, tech stack summary, quick reference |
| **01** | [`01-product-overview.md`](file:///d:/EventOs/brain/01-product-overview.md) | Product vision, target users, value proposition, and core modules |
| **02** | [`02-architecture.md`](file:///d:/EventOs/brain/02-architecture.md) | Microservices topology, Spring Cloud Gateway, RabbitMQ event bus, and boundaries |
| **03** | [`03-codebase-map.md`](file:///d:/EventOs/brain/03-codebase-map.md) | Full directory tree, service responsibilities, key frontend files, and shared libraries |
| **04** | [`04-feature-inventory.md`](file:///d:/EventOs/brain/04-feature-inventory.md) | Status of every single feature (Implemented, In Progress, Planned, Stubbed) |
| **05** | [`05-routes-and-api.md`](file:///d:/EventOs/brain/05-routes-and-api.md) | Complete frontend route map & backend REST/WebSocket API endpoints catalog |
| **06** | [`06-database-and-data-model.md`](file:///d:/EventOs/brain/06-database-and-data-model.md) | Multi-DB architecture (`auth`, `crm`, `event`, `gallery`), schemas, relations, and migrations |
| **07** | [`07-authentication-and-authorization.md`](file:///d:/EventOs/brain/07-authentication-and-authorization.md) | RSA-256 JWT lifecycle, refresh tokens, 2FA, RBAC, tenant security context |
| **08** | [`08-ui-design-system.md`](file:///d:/EventOs/brain/08-ui-design-system.md) | Obsidian Dark theme, palette, typography, glassmorphism, Framer Motion animations |
| **09** | [`09-user-workflows.md`](file:///d:/EventOs/brain/09-user-workflows.md) | End-to-end workflows: Lead ➔ Proposal ➔ Event ➔ Run-of-Show ➔ Invoice ➔ Photo Gallery |
| **10** | [`10-integrations.md`](file:///d:/EventOs/brain/10-integrations.md) | Stripe, Cloudinary, WhatsApp Business, SMTP/Resend, PostHog, Clarity |
| **11** | [`11-deployment-and-environment.md`](file:///d:/EventOs/brain/11-deployment-and-environment.md) | Docker Compose, Caddyfile, Kubernetes/Helm, resource allocations, and env variables |
| **12** | [`12-business-logic.md`](file:///d:/EventOs/brain/12-business-logic.md) | Multi-tenancy isolation rules, financial calculations, status transition machines |
| **13** | [`13-known-issues-and-technical-debt.md`](file:///d:/EventOs/brain/13-known-issues-and-technical-debt.md) | Prioritized inventory of tech debt, security concerns, performance bottlenecks, and bugs |
| **14** | [`14-development-rules.md`](file:///d:/EventOs/brain/14-development-rules.md) | Non-negotiable engineering rules, coding standards, commit policies, and testing guidelines |
| **15** | [`15-current-project-state.md`](file:///d:/EventOs/brain/15-current-project-state.md) | Living state tracker — what is live, in development, or blocked |
| **16** | [`16-future-roadmap.md`](file:///d:/EventOs/brain/16-future-roadmap.md) | Planned expansions derived from codebase markers and feature flags |

---

## 🏛️ Architecture & Product Decisions

Located in [`decisions/`](file:///d:/EventOs/brain/decisions):
- [`architecture-decisions.md`](file:///d:/EventOs/brain/decisions/architecture-decisions.md) — AD-001 (Microservices via Spring Cloud Gateway & RabbitMQ), AD-002 (PostgreSQL separate DB per service), etc.
- [`product-decisions.md`](file:///d:/EventOs/brain/decisions/product-decisions.md) — PD-001 (India-first market focus, INR, GST), PD-002 (All-in-one agency OS vs point solutions)
- [`design-decisions.md`](file:///d:/EventOs/brain/decisions/design-decisions.md) — DD-001 (Obsidian Purple/Pink aesthetic, high contrast dark theme)

---

## 📝 Session Memory Logs

Located in [`sessions/`](file:///d:/EventOs/brain/sessions):
- [`README.md`](file:///d:/EventOs/brain/sessions/README.md) — Session logging guidelines and template.
- [`2026-09-21-brain-initialization.md`](file:///d:/EventOs/brain/sessions/2026-09-21-brain-initialization.md) — Initial codebase audit, system discovery, and memory initialization.

---

## 📂 Deep Dive Reference Guides

Additional granular reference documents:
- [`00_INDEX_AND_SYSTEM_MAP.md`](file:///d:/EventOs/brain/00_INDEX_AND_SYSTEM_MAP.md) — Architectural overview, network ports, and tech matrix
- [`01_PROJECT_VISION_AND_MODULES.md`](file:///d:/EventOs/brain/01_PROJECT_VISION_AND_MODULES.md) — Detailed module breakdown and personas
- [`02_BACKEND_ARCHITECTURE_AND_APIS.md`](file:///d:/EventOs/brain/02_BACKEND_ARCHITECTURE_AND_APIS.md) — Service-by-service Java/Spring breakdown
- [`03_FRONTEND_AND_UI_SPECIFICATIONS.md`](file:///d:/EventOs/brain/03_FRONTEND_AND_UI_SPECIFICATIONS.md) — Next.js 15 App router and frontend architecture
- [`04_DATABASE_SCHEMAS_AND_TENANCY.md`](file:///d:/EventOs/brain/04_DATABASE_SCHEMAS_AND_TENANCY.md) — Detailed schema mappings and isolation mechanics
- [`05_INTEGRATIONS_CONFIG_AND_TEMPLATES.md`](file:///d:/EventOs/brain/05_INTEGRATIONS_CONFIG_AND_TEMPLATES.md) — 3D HTML templates and external webhook specifications
- [`06_SECURITY_AUTH_AND_PERMISSIONS.md`](file:///d:/EventOs/brain/06_SECURITY_AUTH_AND_PERMISSIONS.md) — RBAC matrix and security hardening notes
- [`07_DEVOPS_DOCKER_AND_DEPLOYMENT.md`](file:///d:/EventOs/brain/07_DEVOPS_DOCKER_AND_DEPLOYMENT.md) — Production operations manual
- [`08_CHANGE_HISTORY_AND_HARDENING_LOG.md`](file:///d:/EventOs/brain/08_CHANGE_HISTORY_AND_HARDENING_LOG.md) — Change log and historical hardening audits
