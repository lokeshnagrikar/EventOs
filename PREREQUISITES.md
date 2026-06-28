# EventOS — Prerequisites Guide

This guide details the software, environmental, and infrastructure (PostgreSQL, Redis, RabbitMQ) prerequisites required to run the **EventOS** backend microservices and Next.js frontend manually.

---

## 🛠️ Software Prerequisites

Ensure the following tools are installed and configured on your path:

1. **Java Development Kit (JDK) 17**
   * Verifiable via: `java -version`
2. **Maven 3.9+**
   * Verifiable via: `mvn -version`
3. **Node.js (v18+ recommended)** & **npm (v9+)**
   * Verifiable via: `node -v` and `npm -v`
4. **Docker Desktop** (Recommended to simplify infrastructure hosting)
   * Verifiable via: `docker --version`

---

## 🗄️ Infrastructure Prerequisites (PostgreSQL, Redis, RabbitMQ)

The backend microservices rely on three primary infrastructure components. Here is an explanation of what each does and how it fits into the EventOS architecture:

### 1. PostgreSQL (Port 5433)
* **What it is**: PostgreSQL is a powerful, open-source object-relational database system.
* **Role in EventOS**: It serves as the primary persistent relational datastore. 
  * **Database-per-Service Pattern**: To maintain loose coupling and service boundaries, each microservice has its own isolated database schema:
    1. `auth_db` — Manages users, credentials, roles, and authentication sessions.
    2. `crm_db` — Stores client information, pipeline leads, and quote details.
    3. `event_db` — Handles bookings, schedules, and event details.
    4. `gallery_db` — Tracks image assets, albums, and media metadata.
  * **Multi-Tenant Isolation**: EventOS uses a tenant-based architecture where most tables require a `tenant_id`. PostgreSQL enforces this with constraint checks. If an operation tries to insert or update records without a valid tenant context (e.g., if a background consumer thread has a null tenant ID context), PostgreSQL will immediately abort the transaction.
* **Requirements**:
  * **Instance Port**: Must listen on **`5433`** (non-standard port to avoid conflicts with default PostgreSQL installations).
  * **Superuser Credentials**:
    * **Username**: `eventos_admin`
    * **Password**: `eventos_secure_pass`

### 2. Redis (Port 6379)
* **What it is**: Redis is an in-memory, key-value data structure store used as a database, cache, and message broker.
* **Role in EventOS**: It is used as a high-performance cache and temporary store.
  * **Dashboard Caching**: Frequently accessed dashboard analytics, pipeline stats, and system metrics are cached in Redis to prevent hitting PostgreSQL repeatedly.
  * **Rate Limiting**: Used by the API Gateway to track request rates per client IP or token to prevent API abuse.
* **Requirements**:
  * **Instance Port**: **`6379`** (default).
  * **Credentials**: No password authentication is configured for development.

### 3. RabbitMQ (AMQP Port 5672 | Management Port 15672)
* **What it is**: RabbitMQ is a message broker that implements the Advanced Message Queuing Protocol (AMQP).
* **Role in EventOS**: It enables asynchronous event-driven communication and decoupling between microservices.
  * **Event Brokerage**: When state changes happen (e.g., a booking is created or a quote status is updated), the producing service publishes an event message to the RabbitMQ exchange.
  * **Exchange**: EventOS declares a topic exchange named `eventos.exchange`.
  * **Decoupled Processing**: Consuming services (like `gallery-service` or background notification handlers) subscribe to queues bound to the exchange using routing keys (e.g., `booking.created`, `quote.status.*`). This allows actions like creating folders or sending emails to occur asynchronously without blocking the user's HTTP request-response flow.
* **Requirements**:
  * **AMQP Port**: **`5672`** (default).
  * **Management UI Port**: **`15672`** (accessible via browser at `http://localhost:15672`).
  * **Credentials**:
    * **Username**: `eventos_guest`
    * **Password**: `eventos_guest_pass`
  * **VHost**: Uses the default virtual host (`/`).

---

### Option 1: Docker Compose (Highly Recommended Setup)
Instead of installing PostgreSQL, Redis, and RabbitMQ natively on Windows, you can start all three pre-configured services with a single Docker command using the project's root `docker-compose.yml`:

```powershell
# Run from the project root (D:\EventOs)
docker compose up -d postgres redis rabbitmq
```
This automatically configures the databases, ports, and user access.

### Option 2: Manual Native Installation
If running natively as standalone Windows services, install them separately and ensure:
1. PostgreSQL is listening on port **`5433`**, credentials match, and you manually run SQL commands to create the databases: `auth_db`, `crm_db`, `event_db`, and `gallery_db`.
2. Redis is running on port **`6379`**.
3. RabbitMQ is running on port **`5672`** with a user account matching the credentials above, and the Management Plugin enabled.

---

## 🔑 Environmental Credentials & Encryption Keys

Before compiling or running any of the services, you must generate the security RSA keys and setup the environment variables.

### 1. Generate RSA Key Pair for JWT Tokens
The gateway and authentication services use asymmetric RS256 encryption. Create the private/public key files in the project root:

```powershell
# From D:\EventOs
java GenerateRsaKeys.java
```
This generates:
* `jwt_private.pem` (Used by `auth-service` to sign tokens)
* `jwt_public.pem` (Used by `api-gateway` to verify signatures)

### 2. Backend Environment Variables (.env)
Create a `.env` file in the root directory `D:\EventOs` (or verify that it matches the following defaults):

```ini
# PostgreSQL Connections
POSTGRES_PORT=5433
POSTGRES_USER=eventos_admin
POSTGRES_PASSWORD=eventos_secure_pass

# RabbitMQ Connections
RABBITMQ_PORT=5672
RABBITMQ_USER=eventos_guest
RABBITMQ_PASS=eventos_guest_pass

# Security Configurations
JWT_SECRET_KEY=eventos_very_secret_signing_key_for_development_and_testing_purposes
JWT_EXPIRATION_MS=3600000
JWT_REFRESH_EXPIRATION_MS=86400000

# Cloudinary Integration (Mock Mode active by default if left blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Frontend Environment Variables (web/.env)
Create a `.env` file in the `D:\EventOs\web` directory. It should contain the API base URL pointing to the API Gateway:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 🚀 Building and Running (Quick Summary)

Once the prerequisites are ready, follow this workflow:

1. **Rebuild all Backend Services**:
   ```powershell
   cd D:\EventOs\backend
   mvn clean package -DskipTests
   ```

2. **Run manually using `java -jar`** (with memory limit flags) in separate terminal windows:
   ```powershell
     # Auth Service
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar
     # CRM Service
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\crm-service\target\crm-service-1.0.0.jar
     # Event Service
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\event-service\target\event-service-1.0.0.jar
     # Gallery Service
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\gallery-service\target\gallery-service-1.0.0.jar
     # API Gateway
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\api-gateway\target\api-gateway-1.0.0.jar
   ```

3. **Start the Frontend**:
   ```powershell
   cd D:\EventOs\web
   npm run dev
   ```

---

## 🔍 JAR Verification Status (Current Build)

| Service | Target JAR Path | Status | Size |
|---|---|---|---|
| **API Gateway** | `backend/api-gateway/target/api-gateway-1.0.0.jar` | ✅ Present | 54.4 MB |
| **Auth Service** | `backend/auth-service/target/auth-service-1.0.0.jar` | ✅ Present | 76.5 MB |
| **CRM Service** | `backend/crm-service/target/crm-service-1.0.0.jar` | ✅ Present | 86.0 MB |
| **Event Service** | `backend/event-service/target/event-service-1.0.0.jar` | ❌ Missing (Needs rebuild) | — |
| **Gallery Service** | `backend/gallery-service/target/gallery-service-1.0.0.jar` | ✅ Present | 79.2 MB |

> [!NOTE]
> Since we made fixes to `EventRepository`, `EventController`, and the test suites in `event-service`, you need to package the `event-service` to generate its JAR. 
> To package **only** this service (so Maven doesn't clean/delete your other built JARs), run:
> ```powershell
> cd D:\EventOs\backend
> mvn package -DskipTests -pl event-service
> ```

---

*Refer to the full [RUN_GUIDE.md](file:///D:/EventOs/RUN_GUIDE.md) in the project root for step-by-step startup order, verification scripts, and user registration flows.*
