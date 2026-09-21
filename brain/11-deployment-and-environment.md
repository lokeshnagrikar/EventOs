# EventOS — Deployment & Environment

## Local Development

**FACT:**

### Full Stack (Docker)
```bash
docker-compose up -d    # Starts all 14 services
```
**Services started:**
- PostgreSQL (5433), Redis (6379), RabbitMQ (5672/15672)
- auth-service (8081), crm-service (8082), event-service (8083), gallery-service (8084)
- api-gateway (8080)
- Prometheus (9090), Grafana (3002), Loki (3100), Tempo (3200/4317/4318)
- Node Exporter (9100), cAdvisor (8098)
- MailHog (1025/8025), pgAdmin (5050)
- Nginx (80/443)
- Web frontend (3000)

### Frontend Only
```bash
cd web
npm install
npm run dev    # Next.js dev server on port 3000
```

### Backend Only
```bash
cd backend
mvn clean install       # Build all services
# Run individual service via IDE or:
mvn spring-boot:run -pl auth-service
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set required values (JWT secret, DB credentials, Cloudinary keys)
3. Run `docker-compose up -d` or individual services

Source: `docker-compose.yml`, `web/package.json`, `backend/pom.xml`

## Build Commands

**FACT:**

### Frontend
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (port 3000, 8GB max memory) |
| `npm run build` | Production build (8GB max memory) |
| `npm run start` | Production start (port 3000, 4GB max memory) |
| `npm run lint` | ESLint |

### Backend
| Command | Purpose |
|---|---|
| `mvn clean install` | Build all services |
| `mvn clean install -pl auth-service` | Build single service |
| `mvn test` | Run tests (JaCoCo code coverage) |

## Docker Configuration

**FACT:**

### Docker Compose Files
| File | Purpose |
|---|---|
| `docker-compose.yml` | Full development stack (14 services) |
| `docker-compose.dev.yml` | Development overrides |
| `docker-compose.prod.yml` | Production configuration |
| `docker-compose.staging.yml` | Staging configuration |

### Service Dockerfiles
| Service | Dockerfile | Base Image |
|---|---|---|
| auth-service | `backend/auth-service/Dockerfile` | Multi-stage Maven + JRE |
| crm-service | `backend/crm-service/Dockerfile` | Multi-stage Maven + JRE |
| event-service | `backend/event-service/Dockerfile` | Multi-stage Maven + JRE |
| gallery-service | `backend/gallery-service/Dockerfile` | Multi-stage Maven + JRE |
| api-gateway | `backend/api-gateway/Dockerfile` | Multi-stage Maven + JRE |
| web | `web/Dockerfile` | Node.js multi-stage |

### Networks & Volumes
- Network: `eventos-net` (bridge)
- Volumes: `postgres-data`, `redis-data`, `rabbitmq-data`, `prometheus-data`, `grafana-data`

## Production Deployment

### CURRENT

**FACT:**

**Domain:** `eventosapp.in` (frontend), `api.eventosapp.in` (API)

**Reverse Proxy:** Caddy (automatic HTTPS)
- `Caddyfile` → routes `api.eventosapp.in` to `api-gateway:8080`
- CORS preflight handling at Caddy level
- Origin spoofing for backend CORS (`header_up Origin "http://localhost:3000"`)

**Alternative deployment:** Render.com
- Frontend endpoint fallback: `https://eventos-api-gateway.onrender.com/api/v1`
- Detected in `api-client.ts` and `SocketContext.tsx` hostname checks

**INFERENCE:**
The application appears to run on a VPS with Docker Compose in production, with Caddy as the TLS-terminating reverse proxy.

### Kubernetes (POSSIBLE/FUTURE)

**FACT:**
- `k8s/deployment.yaml` (22KB) — Full Kubernetes deployment manifests
- `k8s/addons.yaml` (6KB) — Addon configurations
- `k8s/helm/` — Helm charts

**INFERENCE:** Kubernetes deployment is prepared but may not be the current production setup.

## Environment Variables

**FACT (from `.env.example` and `docker-compose.yml`):**

### Required
| Variable | Purpose | Default |
|---|---|---|
| `POSTGRES_USER` | Database user | `eventos_admin` |
| `POSTGRES_PASSWORD` | Database password | `eventos_secure_pass` |
| `JWT_SECRET_KEY` | JWT signing secret | (must be set) |
| `JWT_EXPIRATION_MS` | Access token TTL | 900000 (15 min) |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh token TTL | 604800000 (7 days) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | (must be set for media) |
| `CLOUDINARY_API_KEY` | Cloudinary key | (must be set for media) |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | (must be set for media) |

### Optional
| Variable | Purpose | Default |
|---|---|---|
| `STRIPE_API_KEY` | Stripe payments | (empty = direct mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | (empty) |
| `GOOGLE_CLIENT_ID` | Google OAuth | (hardcoded fallback exists) |
| `SMTP_HOST/PORT/USERNAME/PASSWORD` | Email delivery | (MailHog in dev) |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | Auto-detected from hostname |
| `CORS_ALLOWED_ORIGINS` | CORS whitelist | `https://eventosapp.in,...` |
| `SLACK_WEBHOOK_URL` | Grafana alerts | (empty) |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA | (empty) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | (empty) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics | (empty) |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity | (empty) |

### Frontend Environment
| Variable | File | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `web/.env.local` | API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `web/.env.local` | Google OAuth client |
| `JWT_SECRET_KEY` | `web/.env.local` | Middleware JWT verification |

## Monitoring & Observability

### CURRENT

**FACT:**
- **Metrics:** Prometheus scraping all services via `/actuator/prometheus`
- **Dashboards:** Grafana with provisioned dashboards
- **Logs:** Loki for log aggregation
- **Tracing:** Tempo for distributed tracing (OpenTelemetry)
- **Infrastructure:** Node Exporter + cAdvisor for host/container metrics
- **Health checks:** Spring Boot Actuator health endpoints on all services

### Actuator Endpoints Exposed
`health`, `prometheus`, `info`

Source: `docker-compose.yml`, `api-gateway/src/main/resources/application.yml`, `docker/monitoring/`
