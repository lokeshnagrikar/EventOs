# 🚀 EventOS — Render.com Deployment Guide (Step-by-Step)

> Your project already has all Dockerfiles ready. This guide walks you through Render service-by-service.

---

## 📋 Deployment Order (IMPORTANT — follow this order)

```
1. PostgreSQL (Render managed DB)
2. Redis       (Render managed Redis)
3. RabbitMQ    (Docker private service)
4. Auth Service
5. CRM Service
6. Event Service
7. Gallery Service
8. API Gateway
9. Frontend (Next.js)
```

---

## STEP 1 — Sign Up on Render

1. Go to 👉 **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (lokeshnagrikar)
4. Authorize Render to access your GitHub repos

---

## STEP 2 — Create PostgreSQL Database

> Render provides a managed PostgreSQL — this replaces your local postgres on port 5433.

1. In Render Dashboard → click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `eventos-postgres`
   - **Database**: `eventos_root`
   - **User**: `eventos_admin`
   - **Region**: `Singapore` (closest to India)
   - **Plan**: `Free` (or Starter $7/month for persistent storage)
3. Click **"Create Database"**
4. Wait ~2 minutes for it to provision
5. On the database page, copy these values — **you'll need them for every service**:
   - **Internal Database URL** (looks like `postgres://eventos_admin:xxxx@dpg-xxxx/eventos_root`)
   - **Host** (looks like `dpg-xxxx-a.singapore-postgres.render.com`)
   - **Password** (auto-generated)
   - **Port**: `5432`

> [!IMPORTANT]
> Free PostgreSQL databases on Render **expire after 90 days**. Upgrade to Starter ($7/month) for persistent storage in production.

---

## STEP 3 — Create Redis

1. Click **"New +"** → **"Redis"**
2. Fill in:
   - **Name**: `eventos-redis`
   - **Region**: `Singapore`
   - **Plan**: `Free`
3. Click **"Create Redis"**
4. Copy the **Internal Redis URL** (looks like `redis://red-xxxx:6379`)
   - **Host**: everything after `redis://` before the colon
   - **Port**: `6379`

---

## STEP 4 — Create RabbitMQ (Private Service)

> Render doesn't have managed RabbitMQ, so we deploy it as a private Docker service.

1. Click **"New +"** → **"Private Service"**
2. Choose **"Deploy an existing image from a registry"**
3. Set **Image URL**: `rabbitmq:3.13-management-alpine`
4. Fill in:
   - **Name**: `eventos-rabbitmq`
   - **Region**: `Singapore`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   ```
   RABBITMQ_DEFAULT_USER = eventos_guest
   RABBITMQ_DEFAULT_PASS = eventos_guest_pass
   ```
6. Under **Port**, set: `5672`
7. Click **"Create Private Service"**
8. After deploy, copy the **Internal hostname** (looks like `eventos-rabbitmq`)

---

## STEP 5 — Deploy Auth Service

1. Click **"New +"** → **"Web Service"**
2. Connect **GitHub** → select repo **`EventOs`**
3. Fill in:
   - **Name**: `eventos-auth-service`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: *(leave empty)*
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `backend/auth-service/Dockerfile`
   - **Docker Context**: `backend`
   - **Plan**: `Free`

4. Under **Environment Variables**, add ALL of these:

| Key | Value |
|---|---|
| `POSTGRES_HOST` | *(your Render DB host from Step 2)* |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_DB` | `auth_db` |
| `POSTGRES_USER` | `eventos_admin` |
| `POSTGRES_PASSWORD` | *(your Render DB password from Step 2)* |
| `REDIS_HOST` | *(your Render Redis host from Step 3)* |
| `REDIS_PORT` | `6379` |
| `RABBITMQ_HOST` | `eventos-rabbitmq` |
| `RABBITMQ_PORT` | `5672` |
| `RABBITMQ_USER` | `eventos_guest` |
| `RABBITMQ_PASS` | `eventos_guest_pass` |
| `JWT_SECRET_KEY` | *(any 64+ char random string)* |
| `JWT_EXPIRATION_MS` | `900000` |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` |
| `GATEWAY_TRUST_SECRET` | `eventos_gateway_secure_shared_secret` |
| `RECAPTCHA_ENABLED` | `false` |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` |

5. Click **"Create Web Service"**
6. Wait for build — copy the **Auth Service URL** when done  
   (looks like `https://eventos-auth-service.onrender.com`)

---

## STEP 6 — Deploy CRM Service

1. Click **"New +"** → **"Web Service"**
2. Same GitHub repo **`EventOs`**
3. Fill in:
   - **Name**: `eventos-crm-service`
   - **Dockerfile Path**: `backend/crm-service/Dockerfile`
   - **Docker Context**: `backend`
   - **Plan**: `Free`

4. **Environment Variables**:

| Key | Value |
|---|---|
| `POSTGRES_HOST` | *(same DB host as Step 2)* |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_DB` | `crm_db` |
| `POSTGRES_USER` | `eventos_admin` |
| `POSTGRES_PASSWORD` | *(same DB password)* |
| `REDIS_HOST` | *(same Redis host)* |
| `REDIS_PORT` | `6379` |
| `RABBITMQ_HOST` | `eventos-rabbitmq` |
| `RABBITMQ_PORT` | `5672` |
| `RABBITMQ_USER` | `eventos_guest` |
| `RABBITMQ_PASS` | `eventos_guest_pass` |
| `JWT_SECRET_KEY` | *(same key as auth-service)* |
| `CLOUDINARY_CLOUD_NAME` | *(your Cloudinary cloud name)* |
| `CLOUDINARY_API_KEY` | *(your Cloudinary API key)* |
| `CLOUDINARY_API_SECRET` | *(your Cloudinary API secret)* |
| `GATEWAY_TRUST_SECRET` | `eventos_gateway_secure_shared_secret` |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` |

5. Click **"Create Web Service"**

---

## STEP 7 — Deploy Event Service

1. **"New +"** → **"Web Service"** → same repo
2. Fill in:
   - **Name**: `eventos-event-service`
   - **Dockerfile Path**: `backend/event-service/Dockerfile`
   - **Docker Context**: `backend`

3. **Environment Variables** (same as CRM Service but change `POSTGRES_DB`):

| Key | Value |
|---|---|
| `POSTGRES_DB` | `event_db` |
| *(all other keys)* | *(same as CRM Service)* |

Also add:
| Key | Value |
|---|---|
| `SERVICE_CRM_BASE_URL` | `https://eventos-crm-service.onrender.com/api/v1/crm` |
| `SERVICE_AUTH_BASE_URL` | `https://eventos-auth-service.onrender.com/api/v1/auth` |

---

## STEP 8 — Deploy Gallery Service

1. **"New +"** → **"Web Service"** → same repo
2. Fill in:
   - **Name**: `eventos-gallery-service`
   - **Dockerfile Path**: `backend/gallery-service/Dockerfile`
   - **Docker Context**: `backend`

3. **Environment Variables** (same as Event Service but change `POSTGRES_DB`):

| Key | Value |
|---|---|
| `POSTGRES_DB` | `gallery_db` |
| *(all other keys)* | *(same as Event Service)* |

---

## STEP 9 — Deploy API Gateway

1. **"New +"** → **"Web Service"** → same repo
2. Fill in:
   - **Name**: `eventos-api-gateway`
   - **Dockerfile Path**: `backend/api-gateway/Dockerfile`
   - **Docker Context**: `backend`

3. **Environment Variables**:

| Key | Value |
|---|---|
| `AUTH_SERVICE_URL` | `https://eventos-auth-service.onrender.com` |
| `CRM_SERVICE_URL` | `https://eventos-crm-service.onrender.com` |
| `EVENT_SERVICE_URL` | `https://eventos-event-service.onrender.com` |
| `GALLERY_SERVICE_URL` | `https://eventos-gallery-service.onrender.com` |
| `GATEWAY_TRUST_SECRET` | `eventos_gateway_secure_shared_secret` |
| `SPRING_PROFILES_ACTIVE` | `prod` |

4. Copy the **API Gateway URL** when done  
   (looks like `https://eventos-api-gateway.onrender.com`)

---

## STEP 10 — Deploy Frontend (Next.js)

1. **"New +"** → **"Web Service"** → same repo
2. Fill in:
   - **Name**: `eventos-frontend`
   - **Root Directory**: `web`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `web/Dockerfile`
   - **Docker Context**: `web`
   - **Plan**: `Free`

3. **Environment Variables**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://eventos-api-gateway.onrender.com/api/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `171503360314-e51mor0dee5v5f5jqi3gincelrhuva4l.apps.googleusercontent.com` |

4. Click **"Create Web Service"**
5. Your app goes live at: **`https://eventos-frontend.onrender.com`** 🎉

---

## STEP 11 — Create Database Schemas (One-time setup)

Since Render PostgreSQL creates only one database (`eventos_root`), you need to create the individual databases for each service:

1. In Render → go to your **PostgreSQL** service
2. Click **"Connect"** → **"PSQL Command"**
3. Run these SQL commands:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE crm_db;
CREATE DATABASE event_db;
CREATE DATABASE gallery_db;

GRANT ALL PRIVILEGES ON DATABASE auth_db TO eventos_admin;
GRANT ALL PRIVILEGES ON DATABASE crm_db TO eventos_admin;
GRANT ALL PRIVILEGES ON DATABASE event_db TO eventos_admin;
GRANT ALL PRIVILEGES ON DATABASE gallery_db TO eventos_admin;
```

4. Restart all backend services — Flyway will automatically create the tables!

---

## ✅ Final Verification Checklist

After all services are deployed, verify them in this order:

```
□ PostgreSQL — green in Render dashboard
□ Redis — green in Render dashboard
□ RabbitMQ — private service is "Live"
□ Auth Service  → https://eventos-auth-service.onrender.com/api/v1/auth/actuator/health
□ CRM Service   → https://eventos-crm-service.onrender.com/api/v1/crm/actuator/health
□ Event Service → https://eventos-event-service.onrender.com/api/v1/events/actuator/health
□ Gallery       → https://eventos-gallery-service.onrender.com/api/v1/gallery/actuator/health
□ API Gateway   → https://eventos-api-gateway.onrender.com/actuator/health
□ Frontend      → https://eventos-frontend.onrender.com
```

All should return `{"status":"UP"}` ✅

---

## ⚠️ Common Render Issues

### Services spin down after 15 minutes (Free plan)
Free services sleep when inactive. First request takes ~30 seconds to wake up.
**Fix**: Upgrade to Starter ($7/month) or use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping every 10 minutes.

### Build fails with "Out of Memory"
Free Render builds have 512MB RAM limit. Spring Boot + Maven can exceed this.
**Fix**: Add this to your Dockerfile build args: `ENV MAVEN_OPTS="-Xmx400m"`

### Database connection refused
Make sure you used **Internal hostname** (not external) for DB connections between services.

---

## 💰 Render Free Plan Limits

| Resource | Free Limit |
|---|---|
| Web Services | Sleep after 15 min inactivity |
| PostgreSQL | 90-day expiry, 1GB storage |
| Redis | 25MB storage |
| Bandwidth | 100GB/month |
| Build minutes | 500/month |
