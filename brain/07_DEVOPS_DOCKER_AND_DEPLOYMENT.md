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

## 4. Production Cloudflare & VPS Infrastructure Topology
 
```
               [ Internet Visitors / Browsers ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ eventosapp.in ]              [ api.eventosapp.in ]
      (Cloudflare Anycast)           (Cloudflare DNS Only)
               │                               │
               ▼                               ▼
      [ Vercel Edge Server ]         [ Ubuntu VPS Host ]
       (Next.js 15 SSR/PWA)           (200.234.47.154)
                                               │
                                      ┌────────┴────────┐
                                      ▼                 ▼
                              [ Caddy Proxy ]    [ Docker Network ]
                                              ├── api-gateway (:8080)
                                              ├── auth-service (:8081)
                                              ├── crm-service (:8082)
                                              ├── event-service (:8083)
                                              ├── gallery-service (:8084)
                                              ├── postgres (:5433)
                                              ├── redis (:6379)
                                              └── rabbitmq (:5672)
```

### 4.1 Production Email Architecture
* **Inbound Mailboxes (`@eventosapp.in`)**:
  - Handled by **Cloudflare Email Routing**.
  - `admin@eventosapp.in` and `support@eventosapp.in` forward seamlessly to the founder's destination inbox (`nagrikarlokesh24468@gmail.com`).
  - Zero recurring cost and zero mailbox maintenance overhead.
* **Outbound Transactional Email**:
  - Dispatched via **Resend SMTP Relay** (`smtp.resend.com:587`) using dedicated sending subdomain `send.eventosapp.in`.
  - Configured with SPF, DKIM, and DMARC verification on Amazon SES backend.
  - Generates responsive dark-mode 3D HTML templates for verification OTPs, password resets, welcome alerts, and founder lead notices.

### 4.2 Production VPS Deployment Runbook
1. **Pull Latest Main Branch**:
   ```bash
   ssh root@200.234.47.154
   cd /root/EventOs # or deployment directory
   git pull --rebase origin main
   ```
2. **Rebuild & Restart Updated Containers**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build auth-service
   ```
3. **Inspect Production Container Health**:
   ```bash
   docker compose ps
   docker logs -f --tail=100 eventos-auth-service
   ```

