# EventOS — Developer Getting Started Guide

Welcome to the **EventOS** developer documentation. This guide walks you through setting up your local development environment to run the microservices, frontend application, databases, and dependencies.

---

## 1. Prerequisites

Before starting, ensure your local workstation has the following components installed and running:

* **Java Development Kit (JDK) 21**: Make sure `JAVA_HOME` is set.
* **Apache Maven 3.9+**: For building the Java services.
* **Node.js (v18.x or v20.x)**: For running the Next.js client.
* **PostgreSQL 15+**: Relational database engine (default port `5433` or `5432`).
* **Redis 7.x**: Session/token store and rate-limiter (default port `6379`).
* **RabbitMQ 3.12+**: Message broker (ports `5672` and management interface `15672`).
* **Mailhog / Mailpit**: SMTP server for mail sandboxing (ports `1025` and web UI `8025`).

---

## 2. Setting Up the Database

EventOS uses a multi-tenant PostgreSQL structure where each service manages its own database schema (`auth_db`, `crm_db`, `event_db`, `gallery_db`).

### Step 1: Create PostgreSQL Databases
Connect to your local Postgres server and run the database initialization commands:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE crm_db;
CREATE DATABASE event_db;
CREATE DATABASE gallery_db;
```

> [!NOTE]
> Alternatively, if you use Docker, running `docker-compose up postgres` will automatically execute ./docker/postgres/init-db.sql to provision these databases.

### Step 2: Flyway Migrations
Spring Boot uses **Flyway** to apply schema migrations automatically at startup. You do not need to execute database DDL scripts manually; the schemas will build as soon as the services start up.

---

## 3. Environment Variables Configuration

Copy the sample environment template from the root folder:
```powershell
cp .env.example .env
```

Open `.env` and fill in the values:
```ini
# PostgreSQL Connections
POSTGRES_USER=your_postgres_username
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5433

# Caches & Broker
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_HOST=localhost

# Security Credentials
JWT_SECRET_KEY=your_base64_encoded_jwt_secret_key_minimum_256_bits
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=86400000

# Cloudinary CDN Integrations
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 4. Building the Backend Services

To compile and pack the Spring Boot microservices into runable `.jar` packages, navigate to the backend directory and run Maven:
```powershell
cd d:\EventOs\backend
mvn clean package -DskipTests
```

---

## 5. Running the Backend Services Locally

Follow the specific manual startup sequence.

### Step 1: Clear Port Conflicts
Run the port clearing commands in a PowerShell window to ensure no previous services are hung on local ports:
```powershell
@(8080, 8081, 8082, 8083, 8084) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Cleared port $_"
    }
}
```

### Step 2: Launch Services in Order
Open 5 separate terminals, load variables using the load script, and start each jar file.

1. **API Gateway (Port 8080)**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   java -Xmx128m -jar d:\EventOs\backend\api-gateway\target\api-gateway-1.0.0.jar
   ```
2. **Auth Service (Port 8081)**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   java -Xmx128m -jar d:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar
   ```
3. **CRM Service (Port 8082)**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   java -Xmx128m -jar d:\EventOs\backend\crm-service\target\crm-service-1.0.0.jar
   ```
4. **Event Service (Port 8083)**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   java -Xmx128m -jar d:\EventOs\backend\event-service\target\event-service-1.0.0.jar
   ```
5. **Gallery Service (Port 8084)**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   java -Xmx128m -jar d:\EventOs\backend\gallery-service\target\gallery-service-1.0.0.jar
   ```

---

## 6. Launching the Frontend Application

Open a new terminal to build and run the Next.js Client Portal:
```powershell
cd d:\EventOs\web
npm install
npm run dev
```

The frontend client is now available at `http://localhost:3000`.

---

## 7. Verification Checklist

To confirm the entire application stack is running correctly, perform the following validation calls:

| Resource | Expected Output | Verification Method |
| :--- | :--- | :--- |
| **Gateway Health** | `{"status":"UP"}` | `GET http://localhost:8080/actuator/health` |
| **Auth Service Health** | `{"status":"UP"}` | `GET http://localhost:8081/api/v1/auth/actuator/health` |
| **CRM Service Health** | `{"status":"UP"}` | `GET http://localhost:8082/api/v1/crm/actuator/health` |
| **Event Service Health** | `{"status":"UP"}` | `GET http://localhost:8083/api/v1/events/actuator/health` |
| **Gallery Service Health** | `{"status":"UP"}` | `GET http://localhost:8084/api/v1/gallery/actuator/health` |
| **Local SMTP Console** | Mailhog Dashboard | Navigate to `http://localhost:8025` in browser |
| **RabbitMQ Management** | Broker Administration Panel | Navigate to `http://localhost:15672` in browser |
