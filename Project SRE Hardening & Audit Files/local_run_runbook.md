# EventOS Local Runbook & SRE Troubleshooting Manual

This guide describes how to run the EventOS platform locally using a hybrid setup (Docker backing-services + manual microservice execution) and how to resolve port conflicts.

---

## 1. Running the Platform (Step-by-Step)

### Step A: Start Infrastructure in Docker
Start **only** the backing database and message brokers in Docker to save RAM and CPU overhead:
```powershell
docker-compose up -d postgres redis rabbitmq
```
*Exposes Postgres (5433), Redis (6379), and RabbitMQ (5672/15672).*

### Step B: Build & Run the Backend Microservices
Ensure your environment parameters are loaded from `.env`, compile the project, and run the services inside separate PowerShell terminal sessions:

1. **Load Env & Compile**:
   ```powershell
   cd d:\EventOs
   .\load_env.ps1
   cd d:\EventOs\backend
   mvn clean install -DskipTests
   ```
2. **Execute Services (Memory Optimized)**:
   Run the compiled JARs directly using tuned JVM limits to keep your CPU/RAM usage low.
   Each service must be run in its **own separate PowerShell terminal**. Load env first in each:
   * **API Gateway (8080)**:
     ```powershell
     cd d:\EventOs
     .\load_env.ps1
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -jar backend\api-gateway\target\api-gateway-1.0.0.jar
     ```
   * **Auth & Billing (8081)**:
     ```powershell
     cd d:\EventOs
     .\load_env.ps1
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -jar backend\auth-service\target\auth-service-1.0.0.jar
     ```
   * **CRM Service (8082)**:
     ```powershell
     cd d:\EventOs
     .\load_env.ps1
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -jar backend\crm-service\target\crm-service-1.0.0.jar
     ```
   * **Event Service (8083)**:
     ```powershell
     cd d:\EventOs
     .\load_env.ps1
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -jar backend\event-service\target\event-service-1.0.0.jar
     ```
   * **Gallery Service (8084)**:
     ```powershell
     cd d:\EventOs
     .\load_env.ps1
     java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -jar backend\gallery-service\target\gallery-service-1.0.0.jar
     ```

### Step C: Build & Start the Frontend (Production Mode)
Build and launch the frontend static server to prevent React memory-leaks and CPU freezes:
```powershell
cd d:\EventOs\web
npm run build
npm run start
```
*Exposes the client on Port 3000.*

---

## 2. Troubleshooting Port Conflicts (Windows)

If a service crashes or exits immediately on start, the port is likely already being used by an active background task.

### How to Free Port 3000 (Next.js)
If `npm run start` exits or freezes, run this in PowerShell to force close the active process:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -Force
```

### How to Free Backend Ports (8080 - 8084)
If any Java microservice throws a `BindException (Address already in use)` error, check and free the corresponding port (e.g. Port `8081` for Auth Service):
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue).OwningProcess -Force
```
