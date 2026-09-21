# EventOS — Development Rules

## Architecture Rules

**FACT:**
- EventOS uses a microservices architecture. Each service has its own database. Never add cross-database joins.
- Inter-service communication MUST use RabbitMQ for async events or HTTP calls for sync queries.
- All new entities in event-service and crm-service MUST extend `AbstractTenantAwareEntity`.
- The API Gateway is the single entry point for all frontend requests. Never expose backend service ports directly.

**RECOMMENDATION:**
- When adding a new service, follow the existing pattern: Application class, config/, controller/, dto/, entity/, event/, repository/, service/.
- Register new service routes in `api-gateway/src/main/resources/application.yml`.

## Frontend Rules

**FACT:**
- Next.js 15 App Router is used — all pages use the `app/` directory structure.
- State management is via Zustand stores (not Redux, not Context API for data).
- Data fetching uses Axios via `apiClient` (`web/src/lib/api-client.ts`) — never use raw `fetch` for API calls.
- TanStack React Query wraps data fetching for caching and invalidation.
- The `providers.tsx` file is the root client wrapper — all global providers are mounted there.

**RECOMMENDATION:**
- Keep page components under 50KB. Extract sections into dedicated component files.
- Follow the existing component structure: `components/{feature}/` for feature-specific, `components/ui/` for primitives.
- Use Zustand stores for cross-component state, React Query for server state.

## Backend Rules

**FACT:**
- Java 17, Spring Boot 3.3. Use Lombok for boilerplate reduction.
- All entities use UUID primary keys (`@GeneratedValue(strategy = GenerationType.UUID)` or `AUTO`).
- Password hashing uses BCrypt with strength 12.
- MapStruct is available for DTO mapping but usage is inconsistent — some services use manual mapping.
- JaCoCo is configured for test coverage.

**RECOMMENDATION:**
- Follow existing service naming: `{Entity}Service.java`, `{Entity}Controller.java`, `{Entity}Repository.java`.
- Keep service classes focused. The current `AuthService.java` (102KB) is an anti-pattern to avoid.

## API Rules

**FACT:**
- All API paths are prefixed with `/api/v1/{service-context}/`.
- Consistent response structure: `{ data: ..., message: "...", ... }` wrapping.
- JWT Bearer token required in `Authorization` header for protected endpoints.
- `X-Tenant-ID` header required for tenant-scoped operations.
- SpringDoc/Swagger UI available at `/swagger-ui.html` per service.

**RECOMMENDATION:**
- Document new endpoints in Swagger annotations.
- Return appropriate HTTP status codes (201 for creation, 204 for deletion, 400 for validation, 401/403 for auth, 402 for plan limits).

## Database Rules

**FACT:**
- Schema managed by Hibernate auto-DDL. No migration tool is currently in use.
- Each service's database is isolated — never reference tables from another service's database.
- Soft delete pattern: `is_deleted` boolean field on entities.
- Timestamps: `created_at` (non-updatable) and `updated_at` on all entities.
- Sequential numbering uses `TenantSequence` entity with pessimistic locking for concurrency safety.

**RECOMMENDATION:**
- When adding new entities, always include `createdAt`, `updatedAt`, and consider `isDeleted`.
- Consider adding Flyway/Liquibase before schema complexity increases further.

## Authentication Rules

**FACT:**
- JWT secret is shared across all services via `JWT_SECRET_KEY` environment variable.
- Access tokens are verified at both API Gateway level (JwtAuthFilter) and service level (JwtRequestFilter).
- Cookie names `hasSession`, `accessToken`, `user_role` are used by Next.js middleware — do not change these.
- The middleware JWT verification uses the `jose` library and reads `JWT_SECRET_KEY` from the Next.js environment.

## UI Rules

**FACT:**
- Tailwind CSS 3.4 with CSS custom properties (shadcn/ui pattern).
- Colors are defined as CSS variables, not hardcoded Tailwind classes.
- Framer Motion for component animations, GSAP for complex scroll animations.
- Icons: Lucide React primary, Iconify for extended icons.
- Forms: React Hook Form + Zod validation.

**RECOMMENDATION:**
- Use existing UI primitives from `components/ui/` before creating new ones.
- Follow shadcn/ui conventions for new primitive components.
- Keep animations subtle and purposeful — the landing page has heavy effects but dashboard should be performant.

## Design System Rules

**FACT:**
- Company branding is dynamic per workspace (colors, fonts, logos stored in `Company` entity).
- Default theme: Purple (#9333ea) primary, Pink (#db2777) accent, Near-black (#18181b) secondary.
- Dark mode support via Tailwind `class` strategy.

## Animation Rules

**FACT:**
- Landing pages use heavy effects (Three.js, particles, WebGL shaders, GSAP scroll, Lenis).
- Dashboard/portal pages have Lenis explicitly DISABLED to avoid scroll conflicts.
- Page transitions use Framer Motion AnimatePresence with subtle `y` offset.

## Integration Rules

**FACT:**
- External integrations should be configurable via environment variables.
- WhatsApp config is per-company (stored in `Company.whatsappConfig` field).
- Analytics providers are conditionally loaded — not required for functionality.
- RabbitMQ queues are named with service context: `event.booking.queue`, `crm.lead.queue`, etc.

## Security Rules

**FACT:**
- Never expose JWT secrets, API keys, or database credentials in client-side code.
- Rate limiting is enforced at API Gateway level with Redis backing.
- XSS sanitization filter active on auth-service.
- CSP headers set: `default-src 'self'; frame-ancestors 'none'`.
- Account lockout after failed login attempts (configurable threshold).

**RECOMMENDATION:**
- Always validate and sanitize user input on the backend.
- Never trust client-controlled cookies for authorization — always verify JWT cryptographically.

## Deployment Rules

**FACT:**
- Docker Compose is the primary deployment mechanism.
- Production uses Caddy for automatic HTTPS.
- Service health checks are configured for all backend services.
- JVM memory is constrained: `-Xmx256m -XX:+UseSerialGC` for builds/tests.

## Testing Rules

**FACT:**
- Backend: JUnit 5 + Mockito (unit), integration tests exist for event-service.
- Frontend: Playwright configured for E2E testing.
- JaCoCo for code coverage reporting.
- Surefire configured with reduced memory for CI.

**RECOMMENDATION:**
- Add tests for new features before merging.
- Run `mvn test` before committing backend changes.

## Change Management Rules

**RECOMMENDATION:**
- Update `brain/15-current-project-state.md` after significant changes.
- Record architectural decisions in `brain/decisions/`.
- Do not modify database schemas without understanding the ripple effects across services.
- Do not change RabbitMQ queue/exchange names without updating all producers and consumers.
- Do not change cookie names without updating Next.js middleware.
