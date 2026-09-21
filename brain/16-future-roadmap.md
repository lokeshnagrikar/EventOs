# EventOS — Future Roadmap

> Items listed here are based on references found in the codebase (pricing features, UI placeholders, entity fields, documentation).
> They are NOT confirmed development plans — they represent functionality that has been positioned or partially prepared for.

## PLANNED (referenced in pricing/positioning but not fully implemented)

### Real AI Integration
- **Evidence:** AI provider abstraction exists, pricing mentions "AI Quote Generator", "AI Timeline Generator"
- **Current state:** Client-side simulated responses
- **What's needed:** Backend AI service with actual LLM API integration

### SMS Integration
- **Evidence:** `smsSent` tracked in TenantUsage, "Automated WhatsApp & SMS Client Alerts" in Professional plan
- **Current state:** No SMS service implementation
- **What's needed:** SMS provider integration (Twilio, MSG91, etc.)

### Run-of-Show Execution Dashboard
- **Evidence:** WhatsApp `RUN_OF_SHOW_ALERT` template, TimelineTask entities, event timeline items
- **Current state:** Backend entities exist, no dedicated execution UI
- **What's needed:** Real-time dashboard for on-site event crews

### Custom Domain & White-Label
- **Evidence:** `WorkspaceSettings` has `customDomain`, `whiteLabelEnabled`, `customLoginUrl` fields
- **Current state:** Entity fields exist, pricing references it for Agency plan
- **What's needed:** DNS verification, SSL provisioning, custom branding on login

### Developer REST API & Webhooks
- **Evidence:** `ApiKey` entity, `ApiKeyController`, `Integration` entity, Developer settings page
- **Current state:** API key management exists
- **What's needed:** Public API documentation, webhook dispatch system

### Photo Delivery Workflow
- **Evidence:** Gallery share links exist, access logging
- **Current state:** Manual share link creation
- **What's needed:** Automated "deliver to client" flow (email/WhatsApp gallery links post-event)

### Automation Engine
- **Evidence:** Frontend routes, components, `maxAutomationRuns` in plan limits
- **Current state:** UI shell exists
- **What's needed:** Backend automation engine (triggers, actions, conditions)

### Chat / Messaging
- **Evidence:** Frontend route `/chat`
- **Current state:** Route exists, minimal implementation
- **What's needed:** Real-time messaging between team members and/or clients

## INFERENCE (could be next development priorities)

### Page Decomposition
- Dashboard (138KB), Settings (218KB), SuperAdmin (105KB) pages need to be broken into components
- This is the most impactful maintainability improvement

### Database Migration System
- Adding Flyway or Liquibase before the schema grows more complex
- Critical for production data safety

### Comprehensive Testing
- Integration test coverage expansion beyond event-service
- E2E test suite with Playwright
- CI/CD pipeline with test enforcement

Source: `web/src/config/pricing.ts`, entity definitions, component/route structure
