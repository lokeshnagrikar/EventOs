# EventOS — Codebase Map

## Repository Root Structure

```
EventOs/
├── backend/                    # Java Spring Boot microservices (Maven multi-module)
│   ├── pom.xml                 # Parent POM (Spring Boot 3.3, Java 17)
│   ├── api-gateway/            # Spring Cloud Gateway (port 8080)
│   ├── auth-service/           # Authentication, workspaces, billing (port 8081)
│   ├── crm-service/            # CRM: leads, contacts, quotes (port 8082)
│   ├── event-service/          # Events, bookings, invoices, payments (port 8083)
│   └── gallery-service/        # Media albums, share links (port 8084)
├── web/                        # Next.js 15 frontend
│   ├── src/
│   │   ├── app/                # Next.js App Router pages (51+ route groups)
│   │   ├── components/         # React components (20+ directories)
│   │   ├── config/             # Pricing configuration
│   │   ├── context/            # SocketContext (WebSocket)
│   │   ├── hooks/              # Custom hooks (useIdleTimer)
│   │   ├── lib/                # Utilities (api-client, analytics, whatsapp, ai, jwt, redis)
│   │   ├── store/              # Zustand stores (7 stores)
│   │   ├── middleware.ts       # Next.js edge middleware (auth, routing)
│   │   └── proxy.ts            # SSR proxy configuration
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
├── docker/                     # Docker support files
│   ├── backup/
│   ├── logging/                # Loki config
│   ├── monitoring/             # Prometheus, Grafana, Tempo configs
│   ├── nginx/                  # Nginx reverse proxy config
│   └── postgres/               # init-db.sql
├── k8s/                        # Kubernetes deployment manifests + Helm
├── monitoring/                 # Additional monitoring configs
├── operations/                 # Operational scripts
├── scripts/                    # Utility scripts
├── brain/                      # Project memory system (this documentation)
├── docker-compose.yml          # Full development stack (14 services)
├── docker-compose.dev.yml      # Dev overrides
├── docker-compose.prod.yml     # Production config
├── docker-compose.staging.yml  # Staging config
├── Caddyfile                   # Production reverse proxy (api.eventosapp.in)
└── .env.example                # Environment variable template
```

## Backend Service Structure (each service follows this pattern)

**FACT:**

```
{service}/
├── Dockerfile
├── pom.xml
└── src/main/java/com/eventos/{service}/
    ├── {Service}Application.java     # Spring Boot entry point
    ├── config/                       # Security, messaging, cache, filters
    ├── consumer/                     # RabbitMQ message consumers
    ├── controller/                   # REST API controllers
    ├── dto/                          # Data Transfer Objects
    ├── entity/                       # JPA entities (database models)
    ├── event/                        # Domain events for RabbitMQ
    ├── exception/                    # Custom exception classes
    ├── repository/                   # Spring Data JPA repositories
    ├── scheduler/                    # Cron/scheduled tasks
    └── service/                      # Business logic services
```

## Frontend App Router Structure

**FACT (from `web/src/app/`):**

### Public / Marketing Routes
- `/` — Landing page (page.tsx, 8.8KB)
- `/about` — About page
- `/blog` — Blog
- `/book-demo` — Demo booking
- `/calculator` — Budget calculator
- `/careers` — Careers page
- `/contact` — Contact form
- `/cookies`, `/privacy`, `/terms`, `/refund`, `/sla` — Legal pages
- `/features`, `/solutions`, `/resources` — Marketing pages
- `/founder`, `/founder-story` — Founder section
- `/pricing` — Pricing page
- `/security` — Security page
- `/status` — Status page
- `/tour` — Product tour

### Auth Routes (grouped under `(auth)`)
- `/login` — Login (redirects to `/?login=true`)
- `/register` — Register (redirects to `/?register=true`)
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset form
- `/verify-email` — Email verification

### Protected Routes (require authentication)
- `/dashboard` — Main agency dashboard (138KB single page)
- `/workspace-select` — Workspace switcher
- `/onboarding` — New workspace onboarding
- `/crm` — CRM lead management
- `/crm/new` — New lead form
- `/crm/lead-scoring` — AI lead scoring
- `/crm/referrals` — Referral tracking
- `/events` — Event list
- `/events/[id]` — Event detail
- `/events/auto-scheduler` — Auto scheduling
- `/bookings` — Booking list
- `/bookings/[id]` — Booking detail
- `/quotes` — Quote list
- `/quotes/new` — New quote
- `/quotes/[id]` — Quote detail
- `/quotes/ai-generator` — AI quote generation
- `/quotes/share` — Quote sharing
- `/invoices` — Invoice management
- `/payments` — Payment tracking
- `/gallery` — Album gallery
- `/gallery/[id]` — Album detail
- `/activity` — Activity feed
- `/ai` — AI assistant
- `/chat` — Chat
- `/developer` — Developer API settings
- `/import` — Data import
- `/automation` — Workflow automation
- `/finance` — Financial overview
- `/reports` — Reports & analytics
- `/settings` — Workspace settings (218KB single page)
- `/settings/security` — Security settings

### Client Portal Routes
- `/portal` — Client dashboard
- `/portal/quotes` — View quotes
- `/portal/invoices` — View invoices
- `/portal/gallery` — View galleries
- `/portal/timeline` — View event timeline
- `/portal/support` — Support
- `/portal/settings` — Client settings

### Superadmin Routes
- `/superadmin` — Platform admin dashboard (105KB single page)
- `/superadmin/login` — Superadmin login

### Other Routes
- `/accept-invite` — Team invitation acceptance
- `/share` — Public share pages
- `/quote-calculator` — Public quote calculator
- `/design-system-demo` — Design system showcase
- `/demo` — Demo page
- `/docs` — Documentation
- `/help` — Help center

### API Routes (Next.js)
- `/api/waitlist` — Waitlist registration
- `/api/webhooks` — Webhook handlers

## Frontend Component Structure

**FACT (from `web/src/components/`):**

```
components/
├── ai/                 # AI-related components
├── auth/               # LoginForm, AuthModal, LogoutConfirmation, SessionTimeoutHandler
├── automation/          # Workflow automation UI
├── bookings/            # Booking management components
├── crm/                 # CRM-specific components
├── dashboard/           # Dashboard widgets
├── developer/           # Developer API documentation
├── events/              # Event management components
├── finance/             # Financial components
├── gallery/             # Gallery/album components
├── help/                # Help center, contextual help, help search
├── landing/             # 26+ landing page sections (Hero, Features, Pricing, etc.)
├── marketing/           # Marketing-specific components
├── notifications/       # Notification system
├── onboarding/          # OnboardingWizard, ProductTourSpotlight, CelebrationOverlay
├── quote/               # Quote builder components
├── reports/             # Reports & analytics
├── settings/            # Settings page components
├── shared/              # CookieConsentBanner
├── ui/                  # 41 UI primitives (buttons, cards, modals, animations, etc.)
├── AiAssistant.tsx      # Global AI assistant panel (43KB)
├── CommandPalette.tsx   # Cmd+K command palette
├── SmartSearch.tsx      # Global search (14KB)
├── ToastContainer.tsx   # Toast notifications
├── PWAProvider.tsx      # Progressive Web App support
└── pricing-table.tsx    # Pricing comparison table
```

## Zustand Stores

**FACT (from `web/src/store/`):**

| Store | File | Purpose |
|---|---|---|
| authStore | `authStore.ts` | Authentication state, tokens, user profile, workspace |
| billingStore | `billingStore.ts` | Subscription, plans, usage, payment methods, invoices |
| onboardingStore | `onboardingStore.ts` | Onboarding wizard state |
| helpStore | `helpStore.ts` | Help center state |
| celebrationStore | `celebrationStore.ts` | Celebration overlay triggers |
| limitStore | `limitStore.ts` | Plan limit exceeded modal |
| authModalStore | `authModalStore.ts` | Auth modal open/close state |

Source: `web/src/store/*.ts`
