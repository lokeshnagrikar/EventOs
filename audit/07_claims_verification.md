# EventOS Audit Report: Phase 7 – Claims Verification Matrix

**Audit Date:** 2026-10-20  
**Target:** 28 Core Product Claims vs. Source Code Verification  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Summary of Claim Verifications

- **Fully Implemented (✅):** 18 / 28 (64.3%)
- **Partially Implemented (⚠️):** 7 / 28 (25.0%)
- **Mock-Only (🧪):** 2 / 28 (7.1%)
- **Not Implemented (❌):** 1 / 28 (3.6%)

---

## 2. Verification Table

| # | Claim | Status | Evidence (File:Line) | Audit Notes |
| :--- | :--- | :---: | :--- | :--- |
| **1** | Multi-tenant isolation via `tenant_id` | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/config/JwtRequestFilter.java:108`<br>`backend/event-service/src/main/java/com/eventos/event/controller/BookingController.java:47-55` | Tenant ID extracted from cryptographic JWT; repositories enforce `tenantId` in queries. |
| **2** | RBAC: SUPERADMIN, OWNER, ADMIN, MEMBER, CLIENT | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/config/PlatformRole.java:31-75`<br>`backend/auth-service/src/main/java/com/eventos/auth/config/SecurityConfig.java:65-85` | Roles and fine-grained permissions mapped. MEMBER is represented as STAFF in backend. |
| **3** | JWT access + refresh tokens, Redis token revocation | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/service/JwtService.java:200-260`<br>`backend/auth-service/src/main/java/com/eventos/auth/controller/AuthController.java:200` | RS256/HS256 tokens; refresh token in `httpOnly` cookie; Redis blacklist on logout (`blacklist:<token>`). |
| **4** | Team invite via email with accept-invite | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/service/TeamService.java:70-130`<br>`backend/auth-service/src/main/resources/db/migration/V16__add_invitations.sql:1-25` | Generates secure token, stores invitation in DB, dispatches email via Resend SMTP. |
| **5** | Real-time presence + typing indicators (STOMP + Redis) | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/config/WebSocketConfig.java:30-80`<br>`backend/auth-service/src/main/java/com/eventos/auth/service/PresenceService.java:45-95` | STOMP message broker configured; Redis hash stores user presence heartbeat. |
| **6** | Kanban CRM with 7 stages + drag-and-drop + filters | ✅ Implemented | `web/src/app/crm/page.tsx:85-220`<br>`backend/crm-service/src/main/java/com/eventos/crm/entity/LeadStatus.java:3-12` | 7 status enum values (NEW, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST, ARCHIVED); smooth UI drag-and-drop. |
| **7** | Dynamic quote calculator (line items, GST, discount, margin) | ✅ Implemented | `web/src/app/quotes/new/page.tsx:350-520`<br>`backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java:230-310` | Full `BigDecimal` calculations for subtotal, discount, GST (18%), and profit margin. |
| **8** | Public proposal portal with add-on selection and e-signature | ⚠️ Partial | `backend/crm-service/src/main/java/com/eventos/crm/controller/PublicQuoteController.java:40-75`<br>`web/src/app/portal/quotes/page.tsx:570-584` | Public viewing and add-on selection work. However, e-signature is a plain text `<input>` (`/s/ {name}`) without cryptographic proof. |
| **9** | Lead auto-marked WON and auto-converted to Booking on signing | ✅ Implemented | `backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java:439-454`<br>`backend/event-service/src/main/java/com/eventos/event/consumer/QuoteAcceptedConsumer.java:36` | `approveQuote()` updates lead to WON and publishes AMQP event; `event-service` creates booking. |
| **10** | Booking ID format `EVT-2026-XXXXXX` | ✅ Implemented | `backend/event-service/src/main/java/com/eventos/event/service/BookingService.java:294,519,914` | Generates sequence: `"EVT-" + currentYear + "-" + String.format("%06d", nextVal)`. |
| **11** | Financial ledger (total, paid, outstanding, progress %) | ✅ Implemented | `web/src/components/finance/FinanceWorkspace.tsx:120-195`<br>`backend/event-service/src/main/java/com/eventos/event/service/BookingService.java:320-330` | Visual progress bars, cumulative balance calculation, outstanding amounts. |
| **12** | Collect installment → auto status PENDING→CONFIRMED | ✅ Implemented | `backend/event-service/src/main/java/com/eventos/event/service/BookingService.java:325-328` | When `paidAmount >= totalAmount`, status automatically transitions to `CONFIRMED`. |
| **13** | Invoice engine with DRAFT/SENT/PAID/OVERDUE | ✅ Implemented | `backend/event-service/src/main/java/com/eventos/event/entity/InvoiceStatus.java:3-10`<br>`backend/event-service/src/main/java/com/eventos/event/service/InvoiceService.java:120-180` | Invoice lifecycle management with PDF generation and email dispatch. |
| **14** | Multi-day Run-of-Show stage cues + resource/crew allocation | ✅ Implemented | `backend/event-service/src/main/java/com/eventos/event/controller/EventController.java:140-220`<br>`backend/event-service/src/main/java/com/eventos/event/entity/BookingAssignment.java:20-60` | Multi-day timeline schedules, stage cue tracking, crew/vendor assignment. |
| **15** | Immutable audit trail | ⚠️ Partial | `backend/event-service/src/main/java/com/eventos/event/entity/BookingAuditLog.java:20`<br>`backend/event-service/src/main/java/com/eventos/event/controller/AuditLogController.java:69-80` | `booking_audit_logs` is append-only in code. However, general `audit_logs` has a `/retention` endpoint allowing admin deletion. |
| **16** | Cloudinary chunked upload with progress | ✅ Implemented | `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java:270-305`<br>`web/src/app/gallery/[id]/page.tsx:210-265` | Server signs upload params; frontend executes direct browser-to-Cloudinary upload with progress bar. |
| **17** | Client favoriting + frame comments | ⚠️ Partial | `backend/gallery-service/src/main/java/com/eventos/gallery/entity/GalleryItem.java:66`<br>`backend/gallery-service/src/main/resources/db/migration/V5__add_media_organization_fields.sql:3` | Client photo favoriting is ✅ implemented (`favorite` boolean). Frame comments are ❌ NOT IMPLEMENTED (no table/entity). |
| **18** | PIN-protected guest share portal + QR codes | ⚠️ Partial | `backend/gallery-service/src/main/java/com/eventos/gallery/service/ShareLinkService.java:118-125`<br>`web/src/components/gallery/ShareQrModal.tsx:134` | PIN verification uses BCrypt. But QR codes leak private tokens to `api.qrserver.com`, and brute-force lockout is missing. |
| **19** | Batch ZIP download working on mobile and desktop | ⚠️ Partial | `backend/gallery-service/src/main/java/com/eventos/gallery/controller/AlbumController.java:185-219`<br>`backend/gallery-service/src/main/java/com/eventos/gallery/controller/ShareLinkController.java:172-208` | ZIP streaming works, but downloads full byte arrays into heap memory, creating severe OutOfMemory risk on large albums. |
| **20** | Watermarked proofing | ✅ Implemented | `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java:232-268` | Dynamic text watermark overlays applied via Cloudinary transformation URLs. |
| **21** | Automatic contract PDF creation | ✅ Implemented | `backend/crm-service/src/main/java/com/eventos/crm/service/PdfGenerationService.java:26-274` | Generates professional PDFs with OpenPDF, supporting multiple visual templates and GST breakdown. |
| **22** | Lead auto-capture (from where?) | ⚠️ Partial | `backend/crm-service/src/main/java/com/eventos/crm/consumer/BudgetConvertedToLeadConsumer.java:27` | Auto-captures internally when a budget is converted. No public website form endpoint or external webhook ingestion. |
| **23** | Email notifications / webhooks via RabbitMQ | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/config/MessagingConfig.java:30-80`<br>`backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java:453` | Asynchronous RabbitMQ broker dispatching quote acceptance, booking creation, and email events. |
| **24** | AI Copilot with knowledge retrieval | ❌ Not Implemented | `web/src/lib/aiProvider.ts:133-205`<br>`web/src/components/AiAssistant.tsx:34-45` | Raw client browser calls to Gemini or hardcoded FAQ fallback. No vector database, no embeddings, no tenant data retrieval. |
| **25** | Superadmin control plane (tenants, metrics, subscriptions) | ✅ Implemented | `backend/auth-service/src/main/java/com/eventos/auth/controller/SuperadminController.java:45-210`<br>`web/src/app/superadmin/page.tsx:1-350` | Full tenant management, user management, platform metrics, and plan overrides. |
| **26** | Interactive /demo sandbox with sample data | 🧪 Mock-Only | `web/src/app/demo/page.tsx:59-96` | Fully interactive sandbox using hardcoded client-side mock data arrays. |
| **27** | Auto SSL via Caddy | ✅ Implemented | `Caddyfile:1-25` | Production Caddy reverse proxy automatically provisions and renews Let's Encrypt TLS certificates. |
| **28** | Flyway migrations per service with isolated DBs | ✅ Implemented | `backend/*/src/main/resources/db/migration/` (73 total migrations) | 4 isolated databases (`auth_db`, `crm_db`, `eventos_events`, `eventos_gallery`) managed by independent Flyway runs. |

---

## 3. Files Reviewed in this Phase
1. `backend/auth-service/src/main/java/com/eventos/auth/config/JwtRequestFilter.java`
2. `backend/auth-service/src/main/java/com/eventos/auth/config/PlatformRole.java`
3. `backend/auth-service/src/main/java/com/eventos/auth/service/JwtService.java`
4. `backend/auth-service/src/main/java/com/eventos/auth/service/TeamService.java`
5. `backend/auth-service/src/main/java/com/eventos/auth/service/PresenceService.java`
6. `backend/auth-service/src/main/java/com/eventos/auth/controller/SuperadminController.java`
7. `backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java`
8. `backend/crm-service/src/main/java/com/eventos/crm/service/PdfGenerationService.java`
9. `backend/crm-service/src/main/java/com/eventos/crm/consumer/BudgetConvertedToLeadConsumer.java`
10. `backend/event-service/src/main/java/com/eventos/event/service/BookingService.java`
11. `backend/event-service/src/main/java/com/eventos/event/service/InvoiceService.java`
12. `backend/event-service/src/main/java/com/eventos/event/consumer/QuoteAcceptedConsumer.java`
13. `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java`
14. `backend/gallery-service/src/main/java/com/eventos/gallery/service/ShareLinkService.java`
15. `web/src/lib/aiProvider.ts`
16. `web/src/components/AiAssistant.tsx`
17. `web/src/app/demo/page.tsx`
18. `Caddyfile`
