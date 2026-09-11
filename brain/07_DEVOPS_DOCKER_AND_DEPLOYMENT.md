# 🚀 DevOps, Docker Compose & Deployment Guide

> **Operational runbook, environment variables dictionary, container health probes, and deployment instructions.**

---

## 1. Container Infrastructure & Orchestration

The platform is fully containerized using Docker and Docker Compose on the bridge network `eventos-net`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE TOPOLOGY                           │
├───────────────────┬───────────────────┬─────────────────────────────────────┤
│ Service           │ Host Port         │ Dependency Healthcheck              │
├───────────────────┼───────────────────┼─────────────────────────────────────┤
│ postgres          │ 5433 -> 5432      │ pg_isready -U eventos_admin         │
│ redis             │ 6379 -> 6379      │ redis-cli ping                      │
│ rabbitmq          │ 5672, 15672       │ rabbitmq-diagnostics -q ping        │
│ api-gateway       │ 8080 -> 8080      │ /actuator/health                    │
│ auth-service      │ 8081 -> 8081      │ depends_on: postgres, redis, rabbit │
│ crm-service       │ 8082 -> 8082      │ depends_on: postgres, rabbitmq      │
│ event-service     │ 8083 -> 8083      │ depends_on: postgres, rabbitmq      │
│ gallery-service   │ 8084 -> 8084      │ depends_on: postgres, rabbitmq      │
│ eventos-web       │ 3000 -> 3000      │ depends_on: api-gateway             │
└───────────────────┴───────────────────┴─────────────────────────────────────┘
```

---

## 2. Environment Variables Dictionary (`.env`)

| Variable | Default Value | Description |
|---|---|---|
| `POSTGRES_PORT` | `5433` | Host port mapped to Postgres container |
| `POSTGRES_USER` | `eventos_admin` | Database root administrator |
| `POSTGRES_PASSWORD` | `eventos_secure_pass` | Database master password |
| `REDIS_PORT` | `6379` | In-memory cache port |
| `RABBITMQ_PORT` | `5672` | AMQP protocol port |
| `RABBITMQ_MGMT_PORT` | `15672` | RabbitMQ Web Management console port |
| `JWT_SECRET_KEY` | `9a4f2c8d...` | Symmetric fallback / HMAC secret |
| `JWT_EXPIRATION_MS` | `3600000` | Access token lifespan (1 hour) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` | Refresh token lifespan (7 days) |
| `SMTP_HOST` | `smtp.resend.com` | Transactional email SMTP server |
| `SMTP_PORT` | `587` | SMTP port with STARTTLS |
| `SMTP_USERNAME` | `resend` | Resend SMTP username |
| `SMTP_PASSWORD` | `your_resend_api_key_here` | Resend API Key |
| `APP_MAIL_FROM` | `support@eventosapp.in`| Sender email address |
| `CLOUDINARY_CLOUD_NAME` | `dqvwl8e13` | Cloudinary storage bucket |
| `CLOUDINARY_API_KEY` | `416144262516315` | Cloudinary API key |
| `STRIPE_API_KEY` | `sk_test_...` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY`| `pk_test_...` | Stripe public key |

---

## 3. Standard Operational Commands

### 3.1 Start All Services (Full Stack)
```powershell
# Start all databases and microservices in background
docker compose up -d

# Verify all containers are healthy
docker compose ps
```

### 3.2 Tail Logs for a Specific Service
```powershell
docker compose logs -f auth-service
docker compose logs -f api-gateway
docker compose logs -f eventos-web
```

### 3.3 Rebuild a Specific Microservice After Code Changes
```powershell
docker compose build auth-service
docker compose up -d auth-service
```

### 3.4 Local Hybrid Development (Run Services Locally)
If running Java or Next.js directly on host Windows:
* Ensure database containers are running:
  ```powershell
  docker compose up -d postgres redis rabbitmq
  ```
* Run Next.js frontend:
  ```powershell
  cd web
  npm run dev
  ```
