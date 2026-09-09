# EventOS — Developer Getting Started Guide

Welcome to the **EventOS** developer documentation. This guide walks you through setting up your local environment, building all backend JAR files, starting database dependencies, and running all microservices and the web frontend.

---

## 1. Prerequisites

Before starting, ensure your local machine has the following tools installed:

* **Java Development Kit (JDK) 17 or 21**: Make sure `JAVA_HOME` is set.
* **Apache Maven 3.9+**: For building the Spring Boot microservices.
* **Node.js (v18.x or v20.x)** & **npm**: For running the Next.js client portal.
* **Docker Desktop**: For running PostgreSQL, Redis, and RabbitMQ dependencies.

---

## 2. Infrastructure Services (Databases, Cache & Broker)

EventOS microservices require PostgreSQL (multi-database on port `5433`), Redis (`6379`), and RabbitMQ (`5672` / `15672`).

### Start Infrastructure Containers:
Run from the root directory (`d:\EventOs`):
```powershell
docker compose up -d postgres redis rabbitmq
```

> [!IMPORTANT]
> **Why port 5433?**
> EventOS maps PostgreSQL to port **`5433`** on your host to prevent port conflicts with any existing default PostgreSQL instances on port `5432`.
> If you see `Connection to localhost:5433 refused`, it means the `postgres` container is not running yet. Run `docker compose up -d postgres` to start it.

### Verifying Infrastructure:
```powershell
docker ps
```
You should see:
- `eventos-postgres` (healthy on `0.0.0.0:5433->5432/tcp`)
- `eventos-redis` (healthy on `0.0.0.0:6379->6379/tcp`)
- `eventos-rabbitmq` (healthy on `0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp`)

---

## 3. Environment Variables Configuration

Ensure your `.env` file exists in the root directory:
```powershell
cp .env.example .env
```

Ensure the key values match your setup:
```ini
# PostgreSQL (Container Host Port)
POSTGRES_USER=eventos_admin
POSTGRES_PASSWORD=eventos_secure_pass
POSTGRES_PORT=5433

# Caches & Messaging Broker
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=eventos_guest
RABBITMQ_PASS=eventos_guest_pass

# Security & Tokens
JWT_SECRET_KEY=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=86400000
```

---

## 4. Building All Microservice JAR Packages

To compile and package all Spring Boot microservices into executable `.jar` files, run Maven from the root backend directory:

```powershell
cd d:\EventOs\backend
mvn clean package -DskipTests
```

### Generated Executable JAR Files:
Once compilation succeeds, the following executable JAR packages are generated in each module's `target/` directory:

| Service | Port | Executable JAR File Path |
| :--- | :--- | :--- |
| **API Gateway** | `8080` | `d:\EventOs\backend\api-gateway\target\api-gateway-1.0.0.jar` |
| **Auth Service** | `8081` | `d:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar` |
| **CRM Service** | `8082` | `d:\EventOs\backend\crm-service\target\crm-service-1.0.0.jar` |
| **Event Service** | `8083` | `d:\EventOs\backend\event-service\target\event-service-1.0.0.jar` |
| **Gallery Service** | `8084` | `d:\EventOs\backend\gallery-service\target\gallery-service-1.0.0.jar` |

---

## 5. Starting All Services (Local Development Sequence)

### Step 1: Clear Conflicting Ports
Ensure no leftover processes are blocking service ports:
```powershell
@(8080, 8081, 8082, 8083, 8084) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Cleared port $_"
    }
}
```

### Step 2: Launch Each Microservice
Open 5 separate PowerShell windows (or VS Code / IntelliJ terminal tabs) and run each service with lightweight JVM memory flags:

#### 1. API Gateway (Port 8080)
```powershell
cd d:\EventOs
.\load_env.ps1
java -Xmx128m -Xss256k -XX:+UseSerialGC -jar d:\EventOs\backend\api-gateway\target\api-gateway-1.0.0.jar
```

#### 2. Auth Service (Port 8081)
```powershell
cd d:\EventOs
.\load_env.ps1
java -Xmx128m -Xss256k -XX:+UseSerialGC -jar d:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar
```

#### 3. CRM Service (Port 8082)
```powershell
cd d:\EventOs
.\load_env.ps1
java -Xmx128m -Xss256k -XX:+UseSerialGC -jar d:\EventOs\backend\crm-service\target\crm-service-1.0.0.jar
```

#### 4. Event Service (Port 8083)
```powershell
cd d:\EventOs
.\load_env.ps1
java -Xmx128m -Xss256k -XX:+UseSerialGC -jar d:\EventOs\backend\event-service\target\event-service-1.0.0.jar
```

#### 5. Gallery Service (Port 8084)
```powershell
cd d:\EventOs
.\load_env.ps1
java -Xmx128m -Xss256k -XX:+UseSerialGC -jar d:\EventOs\backend\gallery-service\target\gallery-service-1.0.0.jar
```

> [!TIP]
> **Running inside an IDE (IntelliJ / Eclipse / VS Code):**
> If you run `AuthApplication.java` directly from your IDE, make sure `docker compose up -d postgres redis rabbitmq` is running, and pass VM options `-DPOSTGRES_PORT=5433` or environment variables from `.env` in your Run Configuration.

---

## 6. Launching the Next.js Web Frontend

In a separate terminal, launch the Next.js dev server:
```powershell
cd d:\EventOs\web
npm run dev
```

* **Client & Agency Portal**: `http://localhost:3000`
* **SuperAdmin Command Center**: `http://localhost:3000/superadmin/login`

---

## 7. Alternative: Full One-Command Docker Compose Launch

If you prefer running all microservices and web inside Docker containers without opening separate terminals:
```powershell
cd d:\EventOs
docker compose up -d
```
To view real-time logs across all services:
```powershell
docker compose logs -f auth-service api-gateway event-service
```
To stop all services:
```powershell
docker compose down
```

---

## 8. Service Health & Verification Checklist

| Service | Port | Health Check URL | Expected Response |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| **Auth Service** | `8081` | `http://localhost:8081/api/v1/auth/actuator/health` | `{"status":"UP"}` |
| **CRM Service** | `8082` | `http://localhost:8082/api/v1/crm/actuator/health` | `{"status":"UP"}` |
| **Event Service** | `8083` | `http://localhost:8083/api/v1/events/actuator/health` | `{"status":"UP"}` |
| **Gallery Service** | `8084` | `http://localhost:8084/api/v1/gallery/actuator/health` | `{"status":"UP"}` |
| **PostgreSQL** | `5433` | `psql -h localhost -p 5433 -U eventos_admin auth_db` | Connection accepted |
| **RabbitMQ Management** | `15672` | `http://localhost:15672` | UI Login: `eventos_guest` / `eventos_guest_pass` |
| **Next.js Web** | `3000` | `http://localhost:3000` | Login / Dashboard UI rendered |

---

## 9. Common Troubleshooting

### `Connection to localhost:5433 refused`
* **Cause**: PostgreSQL is not running on port 5433.
* **Fix**: Run `docker compose up -d postgres`. Verify with `docker ps` that `eventos-postgres` has status `Up (healthy)` and maps `0.0.0.0:5433->5432/tcp`.

### `Jar file not found: target/auth-service-1.0.0.jar`
* **Cause**: The Maven package step has not been run on your local machine yet.
* **Fix**: Run `cd d:\EventOs\backend` followed by `mvn clean package -DskipTests`.
