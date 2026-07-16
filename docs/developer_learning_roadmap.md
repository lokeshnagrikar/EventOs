# EventOS — SaaS Developer Learning Roadmap

To successfully run, maintain, scale, and sell **EventOS** as a SaaS developer, here are the key technical and business concepts you should master, broken down by domain.

---

## 1. Backend & Microservices Mastery (Java / Spring Boot)

* **Spring Cloud Gateway**:
  * *Why*: All client requests enter through this gateway.
  * *What to learn*: Request routing rules, path rewrites, filters (like custom rate limiters and auth interception), and reactive programing principles (Project Reactor / WebFlux).
* **Asymmetric Security (RSA JWT)**:
  * *Why*: Securing REST APIs without performance bottlenecks.
  * *What to learn*: Generating public/private key pairs, loading PEM key files inside Java, signing tokens in `auth-service`, and validating signatures statelessly in the Gateway.
* **JPA/Hibernate Advanced Mapping**:
  * *Why*: Dealing with multi-tenant relational schemas.
  * *What to learn*: Lazy vs. Eager fetching, transactional boundaries, custom entity listeners, and Flyway migration schema management (backwards compatibility rules).

---

## 2. Multi-Tenancy & Data Isolation

* **Logical Isolation (Shared Database, Shared Schema)**:
  * *Why*: To prevent cross-company data leakage (the worst disaster in SaaS).
  * *What to learn*: Custom Hibernate Filters, Aspect-Oriented Programming (AOP) for automatic tenant injection, and `ThreadLocal` context storage lifecycle inside multi-threaded Java applications.
* **Physical Isolation (Optional)**:
  * *What to learn*: Setting up separate database schemas per tenant (`Database-per-tenant`) dynamically as you scale.

---

## 3. High-Performance Controls & Caching (Redis)

* **Redis Data Structures**:
  * *Why*: Speed, session storage, and rate protection.
  * *What to learn*: `ZSET` (Sorted Sets) for implementing Sliding Window Rate Limiting, TTL (Time-To-Live) commands for handling JWT blacklisting, and session storage caches.

---

## 4. Async Communications (RabbitMQ)

* **Enterprise Message Broking**:
  * *Why*: Inter-service decoupling and operations logging.
  * *What to learn*: Exchanges (Direct, Fanout, Topic), queue bindings, message acknowledgment (ACK/NACK), and Dead Letter Queues (DLQ) retry patterns.
* **Idempotent Receivers**:
  * *Why*: Network glitches can trigger duplicate messages.
  * *What to learn*: Designing consumer logic that checks if an event has already been processed to prevent duplicate records (e.g. charging twice or double-creating bookings).

---

## 5. Modern Frontend Architecture (Next.js 15 & React 19)

* **Server vs. Client Components**:
  * *Why*: Optimizing page load times and SEO.
  * *What to learn*: Layout management, Next.js routing middleware, and server-side rendering (SSR) data loading policies.
* **Zustand (State Management)**:
  * *Why*: Local browser session, modals, and client-side states.
  * *What to learn*: Designing decoupled, domain-specific client stores.
* **TanStack React Query**:
  * *Why*: Synchronizing server data with the UI.
  * *What to learn*: Query caching, stale time management, Mutations, and Optimistic Updates (showing changes instantly before the server responds).

---

## 6. SRE & Cloud Deployments (DevOps)

* **Observability (LGTM Stack)**:
  * *Why*: When a service goes down, you must know why immediately.
  * *What to learn*:
    * **Prometheus**: Scraping micrometer metrics.
    * **Grafana**: Dashboard design and alerting alerts.
    * **Grafana Loki**: Parsing structured JSON log streams.
    * **Grafana Tempo**: Distributed tracing via OpenTelemetry span context propagation across gateway boundary limits.
* **Nginx & SSL**:
  * *Why*: Exposing the app securely to the public web.
  * *What to learn*: Reverse proxy mapping, CORS policies, and Certbot/SSL certificates configuration.
* **Docker & Kubernetes**:
  * *Why*: Managing running containers and scales.
  * *What to learn*: Writing multi-stage Dockerfiles, Docker Compose orchestrations, Helm charts, and Kubernetes deployments.

---

## 7. SaaS Business Mechanics

* **Stripe Webhook Integrations**:
  * *Why*: Subscriptions expire, payments fail, cards get rejected.
  * *What to learn*: Handling async Stripe events (e.g., `invoice.payment_succeeded`, `customer.subscription.deleted`) to dynamically lock/unlock client workspace access.
* **Domain & Subdomain Routing**:
  * *Why*: Tenants want their own brand subdomains (e.g., `planningagency.eventos.com`).
  * *What to learn*: Wildcard DNS mapping and programmatic subdomain resolution in Next.js middleware and API Gateway filters.
