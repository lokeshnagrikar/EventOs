# 🧠 EventOS Master Brain & Context Repository

> **Single Source of Truth (SSOT)** for EventOS Architecture, Codebase, Microservices, Data Models, Third-Party Integrations, DevOps, and Development History.
> **Last Updated**: September 2026
> **Platform Version**: 2.2.0 (Production Hardened & Fully Containerized)

---

## 🗂️ Brain Navigation & Table of Contents

| File                                                                                                           | Title                                     | Description                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`00_INDEX_AND_SYSTEM_MAP.md`](file:///d:/EventOs/brain/00_INDEX_AND_SYSTEM_MAP.md)                           | **Master Index & System Map**       | High-level topology, quick links, ports, service mapping, and tech stack matrix.                                        |
| [`01_PROJECT_VISION_AND_MODULES.md`](file:///d:/EventOs/brain/01_PROJECT_VISION_AND_MODULES.md)               | **Product Vision & Core Modules**   | Business problem, core user personas, complete event lifecycle, and module breakdowns.                                  |
| [`02_BACKEND_ARCHITECTURE_AND_APIS.md`](file:///d:/EventOs/brain/02_BACKEND_ARCHITECTURE_AND_APIS.md)         | **Backend Architecture & APIs**     | Spring Boot microservices breakdown, reactive gateway, controllers, services, and endpoints.                            |
| [`03_FRONTEND_AND_UI_SPECIFICATIONS.md`](file:///d:/EventOs/brain/03_FRONTEND_AND_UI_SPECIFICATIONS.md)       | **Frontend Architecture & UX**      | Next.js 15 App Router structure, state stores (Zustand), Lenis smooth scroll, and design system.                        |
| [`04_DATABASE_SCHEMAS_AND_TENANCY.md`](file:///d:/EventOs/brain/04_DATABASE_SCHEMAS_AND_TENANCY.md)           | **Database & Multi-Tenancy**        | PostgreSQL 17 databases (`auth_db`, `crm_db`, `event_db`, `gallery_db`), Flyway migrations, and data isolation. |
| [`05_INTEGRATIONS_CONFIG_AND_TEMPLATES.md`](file:///d:/EventOs/brain/05_INTEGRATIONS_CONFIG_AND_TEMPLATES.md) | **Integrations & Email Templates**  | Resend SMTP, Stripe, Cloudinary, RabbitMQ, Redis, Google OAuth, and pre-built 3D HTML templates.                        |
| [`06_SECURITY_AUTH_AND_PERMISSIONS.md`](file:///d:/EventOs/brain/06_SECURITY_AUTH_AND_PERMISSIONS.md)         | **Security, Auth & RBAC**           | Asymmetric RSA256/HMAC JWT tokens, BCrypt hashing, permissions matrix, and CSRF/rate-limiting.                          |
| [`07_DEVOPS_DOCKER_AND_DEPLOYMENT.md`](file:///d:/EventOs/brain/07_DEVOPS_DOCKER_AND_DEPLOYMENT.md)           | **DevOps, Docker & Operations**     | `docker-compose` topology, environment variables dictionary, startup commands, and health probes.                     |
| [`08_CHANGE_HISTORY_AND_HARDENING_LOG.md`](file:///d:/EventOs/brain/08_CHANGE_HISTORY_AND_HARDENING_LOG.md)   | **Project History & Hardening Log** | Chronological log of major milestones, bug fixes, SRE hardening, and feature implementations.                           |

---

## 🌐 High-Level System Architecture Diagram

```
                                  [ Browser / Mobile Client ]
                                                │
                                   HTTP / WS (Port 3000 / 443)
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │           Next.js 15 Frontend (App Router)  │
                         │           Tailwind CSS • Zustand • Lenis   │
                         └──────────────────────┬──────────────────────┘
                                                │
                                  REST API & WebSocket Upgrade
                                     (Port 8080 / api-gateway)
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │         EventOS API Gateway (Port 8080)     │
                         │             Spring Cloud Gateway            │
                         │       CORS • Rate Limiter • Route Proxy     │
                         └──────┬──────────┬──────────┬──────────┬─────┘
                                │          │          │          │
                 ┌──────────────┘          │          │          └──────────────┐
                 ▼                         ▼          ▼                         ▼
      ┌────────────────────┐    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
      │    auth-service    │    │   crm-service    │ │  event-service   │ │ gallery-service  │
      │    (Port 8081)     │    │   (Port 8082)    │ │   (Port 8083)    │ │   (Port 8084)    │
      │ Multi-tenant Auth  │    │ Leads, Pipeline, │ │ Events, Bookings,│ │ Cloudinary Media │
      │ WS STOMP Broker    │    │ Proposals & Quotes│ │ Invoices, Vendors│ │ Watermarked Proof│
      └─────────┬──────────┘    └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                │                        │                    │                    │
                └───────────┬────────────┴───────────┬────────┴────────────────────┘
                            │                        │
                            ▼                        ▼
               ┌────────────────────────┐  ┌───────────────────────────────────┐
               │    PostgreSQL 17+      │  │     RabbitMQ 3.13 (AMQP / TLS)    │
               │  (auth_db, crm_db,     │  │   Exchange: eventos.exchange      │
               │   event_db, gallery_db)│  │   Async inter-service event bus   │
               └────────────────────────┘  └───────────────────────────────────┘
                            │                                │
                            ▼                                ▼
               ┌────────────────────────┐  ┌───────────────────────────────────┐
               │       Redis 7.2        │  │   External Integrations:          │
               │  Token blacklisting,   │  │   • Resend SMTP (Port 587)        │
               │  Rate-limit buckets    │  │   • Stripe Billing                │
               │  Shared session state  │  │   • Cloudinary Media Store        │
               └────────────────────────┘  └───────────────────────────────────┘
```

---

## 🔌 Default Local Ports & Endpoints

| Component                 | Container Name       | Host Port | Internal Port | Protocol / Health Check                                         |
| ------------------------- | -------------------- | --------- | ------------- | --------------------------------------------------------------- |
| **Web Client**      | `eventos-web`      | `3000`  | `3000`      | HTTP (`http://localhost:3000`)                                |
| **API Gateway**     | `api-gateway`      | `8080`  | `8080`      | HTTP (`http://localhost:8080/actuator/health`)                |
| **Auth Service**    | `auth-service`     | `8081`  | `8081`      | HTTP (`http://localhost:8081/api/v1/auth/actuator/health`)    |
| **CRM Service**     | `crm-service`      | `8082`  | `8082`      | HTTP (`http://localhost:8082/api/v1/crm/actuator/health`)     |
| **Event Service**   | `event-service`    | `8083`  | `8083`      | HTTP (`http://localhost:8083/api/v1/events/actuator/health`)  |
| **Gallery Service** | `gallery-service`  | `8084`  | `8084`      | HTTP (`http://localhost:8084/api/v1/gallery/actuator/health`) |
| **PostgreSQL**      | `eventos-postgres` | `5433`  | `5432`      | TCP (`pg_isready -U eventos_admin`)                           |
| **Redis**           | `eventos-redis`    | `6379`  | `6379`      | RESP (`redis-cli ping`)                                       |
| **RabbitMQ AMQP**   | `eventos-rabbitmq` | `5672`  | `5672`      | AMQP 0-9-1                                                      |
| **RabbitMQ Mgmt**   | `eventos-rabbitmq` | `15672` | `15672`     | HTTP Management Console                                         |
| **Grafana** (Opt)   | `grafana`          | `3002`  | `3000`      | HTTP Dashboard                                                  |
| **Tempo** (Opt)     | `tempo`            | `4318`  | `4318`      | OTLP Traces HTTP                                                |

---

## 🛠️ Technology Stack Matrix

* **Frontend Framework**: Next.js 15.0.0 (React 19, TypeScript 5.4, App Router)
* **CSS & Styling**: Tailwind CSS 3.4, Vanilla CSS Design System, Radix UI primitives, Lucide Icons, Iconify
* **Animations & Scrolling**: Framer Motion 12, Lenis Smooth Scroll 1.3, Canvas Confetti
* **Backend Framework**: Java 21 LTS, Spring Boot 3.3.2, Spring Security 6, Spring Data JPA, Spring WebSocket
* **API Gateway**: Spring Cloud Gateway 2023 (Project Reactor / Netty non-blocking IO)
* **Relational Databases**: PostgreSQL 17+ with Flyway schema migration versioning
* **Caching & In-Memory**: Redis 7.2 (Lettuce client)
* **Message Broker**: RabbitMQ 3.13 (Topic & Direct exchanges)
* **Transactional Email**: Resend SMTP Relay (`smtp.resend.com:587` with custom 3D dark-mode HTML templates)
* **Payment Gateways**: Stripe (Subscriptions & Webhooks), Razorpay ready
* **Media & CDN**: Cloudinary Media Engine (Dynamic transformations, watermark overlays, PIN-protected delivery)
* **DevOps**: Docker, Docker Compose, multi-stage alpine Dockerfiles, health probes
