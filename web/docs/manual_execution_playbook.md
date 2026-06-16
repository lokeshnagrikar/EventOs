# EventOS Module Playbook: Build, Test, Audit & Run

This guide outlines the step-by-step commands to manually verify each module of the EventOS platform following the lifecycle rule:
**Feature → Test → Audit → Fix → Next Feature**

---

## 🛠️ Step 0: Infrastructure Prerequisites
Before compiling and running the individual services, the common databases, brokers, and cache instances must be started:

```powershell
# Navigate to workspace root
# Start external Docker containers (PostgreSQL, Redis, RabbitMQ) in the background
docker compose -f docker-compose.prod.yml up -d postgres redis rabbitmq
```

## 🛠️ Step 0.5: Navigate to Backend Directory (For Maven/Java Commands)
All Java microservice commands (`mvn`) must be executed from the `backend` directory:

```powershell
# Navigate to backend directory
cd backend
```

---

## 🔑 Module 1: Authentication, Settings & Team Management (`auth-service`)
Handles security, memberships, tenant registration, password reset flows, and admin settings.

### 1. Compile & Build
```powershell
# Compile classes and package auth-service jar
mvn clean package -pl auth-service -DskipTests
```
### 2. Test
```powershell
# Run the unit tests suite for auth-service
mvn test -pl auth-service
```
### 3. Audit & Inspect
* **Database Schema Check**: Inspect [V2__add_memberships_table.sql](file:///d:/EventOs/backend/auth-service/src/main/resources/db/migration/V2__add_memberships_table.sql) and [V3__database_hardening.sql](file:///d:/EventOs/backend/auth-service/src/main/resources/db/migration/V3__database_hardening.sql).
* **Verify Configuration**: Check [application.yml](file:///d:/EventOs/backend/auth-service/src/main/resources/application.yml) settings (`ddl-auto: validate`).

### 4. Run Module
```powershell
# Run the Spring Boot application
mvn spring-boot:run -pl auth-service
```

---

## 📈 Module 2: CRM, Leads & Quotes (`crm-service`)
Manages sales pipelines, customer acquisitions, conversions, and quotation generations.

### 1. Compile & Build
```powershell
# Compile and package crm-service jar
mvn clean package -pl crm-service -DskipTests
```
### 2. Test
```powershell
# Run the unit test suite for crm-service
mvn test -pl crm-service
```
### 3. Audit & Inspect
* **Verify Migrations**: Check [V5__database_hardening.sql](file:///d:/EventOs/backend/crm-service/src/main/resources/db/migration/V5__database_hardening.sql) for lead indexes.
* **Verify Cache & Logging**: Ensure Redis templates are initialized properly in logs.

### 4. Run Module
```powershell
# Run the Spring Boot application
mvn spring-boot:run -pl crm-service
```

---

## 📅 Module 3: Events, Bookings, Payments & Invoices (`event-service`)
Handles scheduling, custom timelines, team assignments, invoices, ledger balances, and payment processing.

### 1. Compile & Build
```powershell
# Compile and package event-service jar
mvn clean package -pl event-service -DskipTests
```
### 2. Test
```powershell
# Run the unit test suite for event-service
mvn test -pl event-service
```
### 3. Audit & Inspect
* **Verify Database Constraints**: Check [V6__database_hardening.sql](file:///d:/EventOs/backend/event-service/src/main/resources/db/migration/V6__database_hardening.sql) for keys and index validations.

### 4. Run Module
```powershell
# Run the Spring Boot application
mvn spring-boot:run -pl event-service
```

---

## 📷 Module 4: Gallery Service (`gallery-service`)
Handles visual albums, moods boards, and client image/video asset catalogs.

### 1. Compile & Build
```powershell
# Compile and package gallery-service jar
mvn clean package -pl gallery-service -DskipTests
```
### 2. Test
```powershell
# Run the unit test suite for gallery-service
mvn test -pl gallery-service
```
### 3. Audit & Inspect
* **Verify Schemas**: Check [V2__database_hardening.sql](file:///d:/EventOs/backend/gallery-service/src/main/resources/db/migration/V2__database_hardening.sql) index definitions.

### 4. Run Module
```powershell
# Run the Spring Boot application
mvn spring-boot:run -pl gallery-service
```

---

## 🌐 Module 5: API Gateway (`api-gateway`)
Roots request traffic and handles initial rate-limiting and JWT key caching.

### 1. Compile & Build
```powershell
# Compile and package gateway jar
mvn clean package -pl api-gateway -DskipTests
```
### 2. Test & Audit
* **Inspect filter**: Verify JWT signature checks and rate-limiting mappings in [application.yml](file:///d:/EventOs/backend/api-gateway/src/main/resources/application.yml).

### 3. Run Module
```powershell
# Run API gateway routing
mvn spring-boot:run -pl api-gateway
```

---

## 💻 Module 6: Web Frontend (`web`)
Next.js React Client Dashboard, Reports, Settings, Client Portal, Calculator, and Modules.

### 1. Install Dependencies
```powershell
# Navigate to web directory
cd d:/EventOs/web
# Clean install node packages
npm ci
```
### 2. Test & Audit
```powershell
# Check for compile and syntax issues
npm run lint
# Verify vulnerabilities in package tree
npm audit
```
### 3. Build & Dry-Run Production
```powershell
# Build static pages and client bundles
npm run build
```
### 4. Run Development Server
```powershell
# Start local Next.js client
npm run dev
```
Access the dashboard at `http://localhost:3000` (or `https://localhost` if proxied via Nginx).
