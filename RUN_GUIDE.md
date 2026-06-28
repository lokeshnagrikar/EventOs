# EventOS — Complete Manual Startup Guide

> **For Windows + PowerShell** | PostgreSQL on port 5433 | No Docker required for services

---

## 📋 What's Running Where

| Service | Port | Directory |
|---|---|---|
| **Next.js Frontend** | 3000 | `D:\EventOs\web` |
| **API Gateway** | 8080 | `D:\EventOs\backend\api-gateway` |
| **Auth Service** | 8081 | `D:\EventOs\backend\auth-service` |
| **CRM Service** | 8082 | `D:\EventOs\backend\crm-service` |
| **Event Service** | 8083 | `D:\EventOs\backend\event-service` |
| **Gallery Service** | 8084 | `D:\EventOs\backend\gallery-service` |
| **PostgreSQL** | 5433 | Local installation |
| **Redis** | 6379 | Local installation |

---

## ⚠️ IMPORTANT — How to Run Services (Read First)

**Do NOT use `mvn spring-boot:run` directly in PowerShell.**
It causes PowerShell terminal conflicts and fails silently.

**✅ Always use this 2-step method:**
```powershell
# Step 1: Build first (run once, or after any code change)
cd D:\EventOs\backend
mvn clean package -DskipTests

# Step 2: Run each service with java -jar directly (limiting memory is crucial for local stability)
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar
```

---

## 🚀 STARTUP SEQUENCE

Open **6 separate PowerShell windows**, one per service + frontend.
Start them **in this exact order**.

---

### 🔵 Terminal 1 — Kill leftover processes (run first, every time)

```powershell
# Kill anything on the service ports before starting
@(8080, 8081, 8082, 8083, 8084) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port $_"
    }
}
Write-Host "All ports cleared."
```

---

### 🔵 Terminal 2 — API Gateway (Port 8080)

```powershell
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\api-gateway\target\api-gateway-1.0.0.jar
```

**Wait for:**
```
Netty started on port 8080 (http)
Started ApiGatewayApplication
```

---

### 🔵 Terminal 3 — Auth Service (Port 8081)

```powershell
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\auth-service\target\auth-service-1.0.0.jar
```

**Wait for:**
```
HikariPool-1 - Start completed.
Schema "public" is up to date.
Started AuthApplication
```

> ❌ If you see `password authentication failed` → PostgreSQL credentials wrong
> ❌ If you see `Connection refused` → PostgreSQL is not running on port 5433

---

### 🔵 Terminal 4 — CRM Service (Port 8082)

```powershell
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\crm-service\target\crm-service-1.0.0.jar
```

**Wait for:** `Started CrmApplication`

---

### 🔵 Terminal 5 — Event Service (Port 8083)

```powershell
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\event-service\target\event-service-1.0.0.jar
```

**Wait for:** `Started EventApplication`

---

### 🔵 Terminal 6 — Gallery Service (Port 8084)

```powershell
java -Xmx128m -Xss256k -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=40m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -jar D:\EventOs\backend\gallery-service\target\gallery-service-1.0.0.jar
```

**Wait for:** `Started GalleryApplication`

---

### 🔵 Terminal 7 — Frontend (Port 3000)

```powershell
cd D:\EventOs\web
npm run dev
```

**Wait for:**
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

---

## ✅ VERIFY ALL SERVICES ARE UP

Open PowerShell and check all ports at once:

```powershell
@(3000,8080,8081,8082,8083,8084) | ForEach-Object {
    $c = Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
    if ($c) { Write-Host "✅ Port $_ — LISTENING" }
    else     { Write-Host "❌ Port $_ — NOT RUNNING" }
}
```

All 6 should show ✅.

---

## 📝 REBUILD AFTER CODE CHANGES

If you change any Java file, rebuild before restarting:

```powershell
# Rebuild all services
cd D:\EventOs\backend
mvn clean package -DskipTests

# Or rebuild just one service (faster)
mvn clean package -DskipTests -pl auth-service
mvn clean package -DskipTests -pl crm-service
mvn clean package -DskipTests -pl event-service
mvn clean package -DskipTests -pl gallery-service
mvn clean package -DskipTests -pl api-gateway
```

Then restart that service's terminal with `java -jar`.

---

## 🔐 REGISTER A WORKSPACE

### Via Browser (Recommended)

1. Open `http://localhost:3000/register`
2. Fill **Step 1 — Owner Details:**
   - First Name: `Lokesh`
   - Last Name: `Nagrikar`
   - Email: `lokesh@myevents.com`
   - Phone: `9309965483`
3. Click **Next Step**
4. Fill **Step 2 — Workspace Details:**
   - Company Name: `Eventos Studio`
   - Password: `Secret@123`
   - Confirm Password: `Secret@123`
5. Click **Create Workspace**
6. On success → click **Go to Login**

### Via PowerShell (API Test)

```powershell
$body = @{
    firstName   = "Lokesh"
    lastName    = "Nagrikar"
    email       = "lokesh@myevents.com"
    phone       = "9309965483"
    companyName = "Eventos Studio"
    password    = "Secret@123"
} | ConvertTo-Json

try {
    $r = Invoke-WebRequest -Uri "http://localhost:8081/api/v1/auth/register" `
         -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Status:" $r.StatusCode
    Write-Host $r.Content
} catch {
    Write-Host "❌ Status:" $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
}
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "xxxx-xxxx-xxxx",
    "userId": "xxxx-xxxx-xxxx",
    "companyId": "xxxx-xxxx-xxxx",
    "message": "Workspace created successfully"
  }
}
```

---

## 🔑 LOGIN

### Via Browser

1. Open `http://localhost:3000/login`
2. Enter:
   - Email: `lokesh@myevents.com`
   - Password: `Secret@123`
3. Click **Sign In**
4. You will be redirected to the **Dashboard**

### Via PowerShell (API Test)

```powershell
$body = @{
    email    = "lokesh@myevents.com"
    password = "Secret@123"
} | ConvertTo-Json

try {
    $r = Invoke-WebRequest -Uri "http://localhost:8081/api/v1/auth/login" `
         -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Status:" $r.StatusCode
    $data = ($r.Content | ConvertFrom-Json).data
    Write-Host "Access Token:" $data.accessToken.Substring(0,40)"..."
    Write-Host "Tenant ID:" $data.tenantId
    # Save token for subsequent requests
    $global:TOKEN = $data.accessToken
} catch {
    Write-Host "❌ Error:" $_.Exception.Message
}
```

---

## 🧭 USING THE APP — FULL FLOW

Once logged in, here's the natural workflow:

### 1. Dashboard
→ `http://localhost:3000/dashboard`
View stats: total leads, revenue, upcoming events.

### 2. CRM — Create a Lead
→ `http://localhost:3000/crm`
Click **New Lead** → fill client details, event type, budget.

### 3. CRM — Create a Quote
→ Open the lead → click **Create Quote**
Add line items (photography, decoration, catering) → Send to client.

### 4. Events — Create an Event
→ `http://localhost:3000/events`
Click **New Event** → fill event details, date, venue.

### 5. Bookings — Create a Booking
→ `http://localhost:3000/bookings`
Create booking from an approved quote.

### 6. Finance — Invoices & Payments
→ `http://localhost:3000/invoices`
Generate invoice from booking → record advance payment.

### 7. Gallery — Upload Photos
→ `http://localhost:3000/gallery`
Create album → upload photos → share link with client.

### 8. Client Portal
→ `http://localhost:3000/portal`
Client logs in and views: quotes, invoices, event timeline, gallery.

---

## 🔧 TROUBLESHOOTING

### ❌ Auth Service — `Port 8081 was already in use`
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess -Force
# Then restart: java -jar ...auth-service...jar
```

### ❌ Auth Service — `password authentication failed for user "eventos_admin"`
Your local PostgreSQL password is different. Check:
```powershell
# Test connection
$env:PGPASSWORD = "eventos_secure_pass"
psql -U eventos_admin -h localhost -p 5433 -d auth_db -c "SELECT 1"
```
If it fails, find your actual Postgres password and update:
`D:\EventOs\backend\auth-service\src\main\resources\application.yml`
→ change `password:` value.

### ❌ Auth Service — `Connection to localhost:5433 refused`
PostgreSQL is not running. Start it:
- **Windows Service:** `Start-Service -Name postgresql*`
- **Or via pgAdmin:** connect and start server

### ❌ `Registration failed due to a server error`
Check the auth-service terminal for the red `ERROR` line.
Most common causes:
- `Default ADMIN role not found` → roles table is empty, run seed SQL
- `Connection refused` → another service is down

### ❌ Gateway returns `Connection refused: localhost/127.0.0.1:8081`
The auth-service is not running. Start it first.

### ❌ Frontend `ECONNREFUSED` on API calls
The API gateway (port 8080) is not running. Start it first.

---

## 📊 SWAGGER / API DOCS

| Service | URL |
|---|---|
| Auth Service | http://localhost:8081/api/v1/auth/swagger-ui.html |
| CRM Service | http://localhost:8082/api/v1/crm/swagger-ui.html |
| Event Service | http://localhost:8083/api/v1/events/swagger-ui.html |
| Gallery Service | http://localhost:8084/api/v1/gallery/swagger-ui.html |

---

## 🗂️ LOG FILES (for debugging)

Each service writes structured JSON logs:

| Service | Log File |
|---|---|
| Auth | `D:\EventOs\backend\auth-service\logs\auth-service.json` |
| CRM | `D:\EventOs\backend\crm-service\logs\crm-service.json` |
| Event | `D:\EventOs\backend\event-service\logs\event-service.json` |
| Gallery | `D:\EventOs\backend\gallery-service\logs\gallery-service.json` |
| Gateway | `D:\EventOs\backend\api-gateway\logs\api-gateway.json` |

Read last 20 errors from any log:
```powershell
Get-Content "D:\EventOs\backend\auth-service\logs\auth-service.json" |
    ForEach-Object { $_ | ConvertFrom-Json } |
    Where-Object { $_.level -eq "ERROR" } |
    Select-Object -Last 20 |
    ForEach-Object { Write-Host $_.timestamp $_.message }
```

---

## 📦 DEMO DATA (Quick Seed)

If you want to skip registration and load demo data directly into the database:

```powershell
# Run the seed SQL file
$env:PGPASSWORD = "eventos_secure_pass"
psql -U eventos_admin -h localhost -p 5433 `
     -f "C:\Users\LENOVO\.gemini\antigravity-ide\brain\7d2d5bda-bfa0-4ec2-bbc9-6ae313956356\seed_demo_data.sql"
```

This creates:
- ✅ Tenant: **Eventos Studio**
- ✅ Login: `lokesh@myevents.com` / `Secret@123`
- ✅ Lead: Sharma-Kapoor Wedding (₹5.5L)
- ✅ Quote: ₹8.53L with 6 line items
- ✅ Event: Dec 20 2026 @ Leela Palace Delhi
- ✅ Booking + Invoice + Payment (₹2L advance)
- ✅ Gallery album + share link
