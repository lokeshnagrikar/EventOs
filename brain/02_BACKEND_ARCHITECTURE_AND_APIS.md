# ⚙️ Backend Microservices Architecture & API Surface

> **In-depth technical specification of the Java 21 / Spring Boot 3.3.2 microservices, Spring Cloud Gateway, inter-service messaging, and API contracts.**

---

## 1. Microservices Topology

```
                  ┌─────────────────────────────┐
                  │    api-gateway (:8080)      │
                  │    Spring Cloud Gateway     │
                  └──────────────┬──────────────┘
                                 │
         ┌───────────────┬───────┴───────┬───────────────┐
         ▼               ▼               ▼               ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │auth-service │ │ crm-service │ │event-service│ │gallery-serv.│
  │   (:8081)   │ │   (:8082)   │ │   (:8083)   │ │   (:8084)   │
  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
         │               │               │               │
         └───────────────┼───────────────┴───────────────┘
                         │
                         ▼
             [ RabbitMQ: eventos.exchange ]
```

---

## 2. Service-by-Service Technical Specification

### 2.1 API Gateway (`backend/api-gateway` • Port 8080)

* **Technology**: Spring Boot 3.3.2, Spring Cloud Gateway (Project Reactor Netty).
* **Role**: Single entry-point, SSL termination, reverse proxy, global CORS, and WebSocket upgrade handler.
* **Routing Table**:
  ```yaml
  routes:
    - id: auth-service-ws
      uri: ws://auth-service:8081
      predicates:
        - Path=/api/v1/auth/ws/**
    - id: auth-service
      uri: http://auth-service:8081
      predicates:
        - Path=/api/v1/auth/**
    - id: crm-service
      uri: http://crm-service:8082
      predicates:
        - Path=/api/v1/crm/**
    - id: event-service
      uri: http://event-service:8083
      predicates:
        - Path=/api/v1/events/**, /api/v1/bookings/**, /api/v1/client/**
    - id: gallery-service
      uri: http://gallery-service:8084
      predicates:
        - Path=/api/v1/gallery/**
  ```
* **Security & Header Injection**:
  - Validates incoming JWT tokens if enabled.
  - Propagates trusted internal headers to downstream microservices:
    * `X-User-Id`: UUID of authenticated user.
    * `X-Tenant-Id`: UUID of active tenant/workspace.
    * `X-User-Roles`: Comma-separated user roles.
    * `X-User-Email`: Email of user.
    * `X-Gateway-Secret`: Shared secret matching `app.gateway.secret` to prevent direct unproxied calls.

---

### 2.2 Auth Service (`backend/auth-service` • Port 8081)

* **Context Path**: `/api/v1/auth`
* **Datastore**: PostgreSQL `auth_db`
* **Core Responsibilities**:
  * User registration, BCrypt password hashing, and email verification OTP.
  * Multi-workspace tenancy (`tenants`, `users`, `user_tenants`, `workspaces`).
  * JWT issuance (RSA256 private key signed) and refresh token rotation in Redis.
  * Real-Time WebSocket Message Broker (STOMP over SockJS) for presence & notifications.
  * Transactional email dispatcher via Resend SMTP (`smtp.resend.com:587`).
  * Platform billing subscription checkout and Stripe webhooks.
* **Primary Endpoints**:| Method   | Endpoint                             | Access        | Purpose                                      |
  | -------- | ------------------------------------ | ------------- | -------------------------------------------- |
  | `POST` | `/api/v1/auth/register`            | Public        | Register new user + workspace                |
  | `POST` | `/api/v1/auth/login`               | Public        | Authenticate + return JWT & Refresh tokens   |
  | `POST` | `/api/v1/auth/verify-email`        | Public        | Verify 6-digit OTP code                      |
  | `POST` | `/api/v1/auth/resend-verification` | Public        | Resend OTP code                              |
  | `POST` | `/api/v1/auth/refresh`             | Public        | Exchange refresh token for new access token  |
  | `POST` | `/api/v1/auth/magic-link/request`  | Public        | Send 1-click passwordless login link         |
  | `POST` | `/api/v1/auth/magic-link/verify`   | Public        | Sign in via magic link token                 |
  | `POST` | `/api/v1/auth/forgot-password`     | Public        | Request password reset email                 |
  | `POST` | `/api/v1/auth/reset-password`      | Public        | Reset password with token                    |
  | `GET`  | `/api/v1/auth/me`                  | Authenticated | Retrieve current user profile and workspaces |
  | `POST` | `/api/v1/auth/switch-workspace`    | Authenticated | Switch active tenant and get new scoped JWT  |
  | `GET`  | `/api/v1/auth/test-email`          | Public/Debug  | Test Resend SMTP dispatch to a destination   |

---

### 2.3 CRM Service (`backend/crm-service` • Port 8082)

* **Context Path**: `/api/v1/crm`
* **Datastore**: PostgreSQL `crm_db`
* **Core Responsibilities**:
  * Lead capture, status changes, and priority ranking.
  * Interactive quote and proposal generation with PDF exports.
  * Lead activities and contact book.
  * AMQP event publication (`quote.accepted` $\rightarrow$ automatically provisions booking in `event-service`).
* **Primary Endpoints**:| Method       | Endpoint                                        | Access      | Purpose                               |
  | ------------ | ----------------------------------------------- | ----------- | ------------------------------------- |
  | `GET/POST` | `/api/v1/crm/leads`                           | Tenant Auth | List leads or create new lead         |
  | `GET/PUT`  | `/api/v1/crm/leads/{id}`                      | Tenant Auth | View or update lead details / stage   |
  | `POST`     | `/api/v1/crm/leads/{id}/convert`              | Tenant Auth | Convert lead into won client          |
  | `GET/POST` | `/api/v1/crm/proposals`                       | Tenant Auth | List or create interactive proposals  |
  | `GET`      | `/api/v1/crm/proposals/public/{token}`        | Public      | Public client proposal view           |
  | `POST`     | `/api/v1/crm/proposals/public/{token}/accept` | Public      | Client digital sign & accept proposal |

---

### 2.4 Event Service (`backend/event-service` • Port 8083)

* **Context Path**: `/api/v1/events` (also handles `/api/v1/bookings` and `/api/v1/client`)
* **Datastore**: PostgreSQL `event_db`
* **Core Responsibilities**:
  * Event booking schedules, venue reservations, multi-day coordination.
  * Run-of-show timeline cue sheets (cues, stage lighting, performers).
  * Vendor management (categories, contact info, contracts, assignments).
  * Financial ledger: milestone invoicing, payment tracking, PDF invoices.
  * Client Portal endpoints for external hosts and brides/grooms.
* **Primary Endpoints**:| Method       | Endpoint                                        | Access        | Purpose                               |
  | ------------ | ----------------------------------------------- | ------------- | ------------------------------------- |
  | `GET/POST` | `/api/v1/events`                              | Tenant Auth   | List or create events                 |
  | `GET/PUT`  | `/api/v1/events/{id}`                         | Tenant Auth   | Event details & itinerary updates     |
  | `GET/POST` | `/api/v1/events/{id}/timeline`                | Tenant Auth   | Run-of-show cue sheet items           |
  | `GET/POST` | `/api/v1/events/{id}/vendors`                 | Tenant Auth   | Vendor assignments and directory      |
  | `GET/POST` | `/api/v1/events/{id}/invoices`                | Tenant Auth   | Milestone invoice creation and status |
  | `POST`     | `/api/v1/events/invoices/{id}/record-payment` | Tenant Auth   | Mark milestone payment complete       |
  | `GET`      | `/api/v1/client/portal/{token}`               | Public/Client | Client Portal home data               |

---

### 2.5 Gallery Service (`backend/gallery-service` • Port 8084)

* **Context Path**: `/api/v1/gallery`
* **Datastore**: PostgreSQL `gallery_db`
* **Core Responsibilities**:
  * Cloudinary media uploads, automated watermarks, and resolution transformations.
  * Photo proofing: client favoriting and photo selection collections.
  * Secret PIN protection for public gallery links.
  * Full-resolution download access control unlocked by invoice clearance.
  * RabbitMQ consumer: listens for `payment.recorded` to unlock watermarks.
* **Primary Endpoints**:| Method       | Endpoint                                         | Access      | Purpose                             |
  | ------------ | ------------------------------------------------ | ----------- | ----------------------------------- |
  | `GET/POST` | `/api/v1/gallery/albums`                       | Tenant Auth | List or create albums               |
  | `POST`     | `/api/v1/gallery/albums/{id}/photos`           | Tenant Auth | Upload photos to Cloudinary         |
  | `GET`      | `/api/v1/gallery/shared/{shareToken}`          | Public      | Public PIN-protected gallery access |
  | `POST`     | `/api/v1/gallery/shared/{shareToken}/favorite` | Public      | Client selects favorite photo       |
  | `GET`      | `/api/v1/gallery/shared/{shareToken}/download` | Public      | Download original high-res package  |

---

## 3. Asynchronous Event-Driven Messaging (RabbitMQ)

The microservices communicate asynchronously via RabbitMQ exchange `eventos.exchange`:

```
┌─────────────────┐      quote.accepted       ┌─────────────────┐
│   crm-service   ├──────────────────────────►│  event-service  │
└─────────────────┘                           └────────┬────────┘
                                                       │ payment.recorded
                                                       ▼
                                              ┌─────────────────┐
                                              │ gallery-service │
                                              └─────────────────┘
```

* **`eventos.exchange`** (Topic Exchange):
  * `quote.accepted`: Dispatched by `crm-service`. Consumed by `event-service` to provision the booking, setup default timeline, and seed invoices.
  * `payment.recorded`: Dispatched by `event-service` upon invoice payment. Consumed by `gallery-service` to remove preview watermarks and unlock high-res client downloads.
  * `member.invited`: Dispatched by `auth-service`. Triggers welcome notification email via `EmailService`.
