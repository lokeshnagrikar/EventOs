# EventOS — Routes & API Inventory

## Frontend Routes

### Public Routes (no auth required)
| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/about` | `app/about/` | About page |
| `/blog` | `app/blog/` | Blog |
| `/book-demo` | `app/book-demo/` | Demo booking |
| `/calculator` | `app/calculator/` | Budget calculator |
| `/careers` | `app/careers/` | Careers |
| `/contact` | `app/contact/` | Contact form |
| `/cookies` | `app/cookies/` | Cookie policy |
| `/demo` | `app/demo/` | Product demo |
| `/design-system-demo` | `app/design-system-demo/` | Design system showcase |
| `/developer` | `app/developer/` | Developer docs (protected) |
| `/docs` | `app/docs/` | Documentation |
| `/features` | `app/features/` | Feature pages |
| `/founder` | `app/founder/` | Founder info |
| `/founder-story` | `app/founder-story/` | Founder story |
| `/help` | `app/help/` | Help center |
| `/pricing` | `app/pricing/` | Pricing page |
| `/privacy` | `app/privacy/` | Privacy policy |
| `/quote-calculator` | `app/quote-calculator/` | Public quote calculator |
| `/refund` | `app/refund/` | Refund policy |
| `/resources` | `app/resources/` | Resources |
| `/security` | `app/security/` | Security page |
| `/share` | `app/share/` | Public share pages |
| `/sla` | `app/sla/` | SLA |
| `/solutions` | `app/solutions/` | Solutions |
| `/status` | `app/status/` | Status page |
| `/terms` | `app/terms/` | Terms of service |
| `/tour` | `app/tour/` | Product tour |

### Auth Routes (redirect to landing modal)
| Route | Behavior |
|---|---|
| `/login` | Redirects to `/?login=true` |
| `/register` | Redirects to `/?register=true` |
| `/forgot-password` | `app/(auth)/forgot-password/` |
| `/reset-password` | `app/(auth)/reset-password/` |
| `/verify-email` | `app/(auth)/verify-email/` |

### Protected Routes (require `hasSession` or `accessToken` cookie)
| Route | File | Purpose |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` (138KB) | Agency dashboard |
| `/workspace-select` | `app/workspace-select/` | Workspace selection |
| `/onboarding` | `app/onboarding/` | New workspace setup |
| `/crm` | `app/crm/page.tsx` (56KB) | Lead pipeline |
| `/crm/new` | `app/crm/new/` | New lead form |
| `/crm/lead-scoring` | `app/crm/lead-scoring/` | AI lead scoring |
| `/crm/referrals` | `app/crm/referrals/` | Referral tracking |
| `/events` | `app/events/page.tsx` | Event list |
| `/events/[id]` | `app/events/[id]/` | Event detail |
| `/events/auto-scheduler` | `app/events/auto-scheduler/` | Auto scheduling |
| `/bookings` | `app/bookings/page.tsx` | Booking list |
| `/bookings/[id]` | `app/bookings/[id]/` | Booking detail |
| `/quotes` | `app/quotes/page.tsx` | Quote list |
| `/quotes/new` | `app/quotes/new/` | New quote |
| `/quotes/[id]` | `app/quotes/[id]/` | Quote detail |
| `/quotes/ai-generator` | `app/quotes/ai-generator/` | AI quote generation |
| `/quotes/share` | `app/quotes/share/` | Share quotes |
| `/invoices` | `app/invoices/` | Invoice management |
| `/payments` | `app/payments/` | Payment tracking |
| `/gallery` | `app/gallery/page.tsx` (35KB) | Album gallery |
| `/gallery/[id]` | `app/gallery/[id]/` | Album detail |
| `/activity` | `app/activity/` | Activity feed |
| `/ai` | `app/ai/` | AI assistant |
| `/chat` | `app/chat/` | Chat |
| `/developer` | `app/developer/` | Developer API |
| `/import` | `app/import/` | Data import |
| `/automation` | `app/automation/` | Automation |
| `/finance` | `app/finance/` | Finance overview |
| `/reports` | `app/reports/` | Reports |
| `/settings` | `app/settings/page.tsx` (218KB) | Settings (all tabs) |
| `/settings/security` | `app/settings/security/` | Security settings |

### Client Portal Routes (CLIENT role only)
| Route | File | Purpose |
|---|---|---|
| `/portal` | `app/portal/page.tsx` (23KB) | Client dashboard |
| `/portal/quotes` | `app/portal/quotes/` | View proposals |
| `/portal/invoices` | `app/portal/invoices/` | View invoices |
| `/portal/gallery` | `app/portal/gallery/` | View photos |
| `/portal/timeline` | `app/portal/timeline/` | View timeline |
| `/portal/support` | `app/portal/support/` | Support |
| `/portal/settings` | `app/portal/settings/` | Client settings |

### Superadmin Routes (platform roles only, JWT-verified)
| Route | File | Purpose |
|---|---|---|
| `/superadmin` | `app/superadmin/page.tsx` (105KB) | Admin panel |
| `/superadmin/login` | `app/superadmin/login/` | Admin login |

---

## Backend API Endpoints

### Auth Service (`/api/v1/auth/`)

**FACT (from SecurityConfig.java public matchers and AuthController.java):**

#### Public Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/login` | POST | Email/password login |
| `/login/google` | POST | Google OAuth login |
| `/register` | POST | New user registration |
| `/refresh` | POST | Token refresh |
| `/switch` | POST | Switch workspace |
| `/forgot-password` | POST | Request password reset |
| `/reset-password` | POST | Reset password with token |
| `/verify-email` | GET/POST | Email verification |
| `/verify-otp` | POST | OTP verification |
| `/resend-verification` | POST | Resend verification email |
| `/magic-link` | POST | Send magic login link |
| `/verify-magic-token` | POST | Verify magic link token |
| `/send-whatsapp-otp` | POST | Send WhatsApp OTP |
| `/verify-whatsapp-otp` | POST | Verify WhatsApp OTP |
| `/accept-invite` | POST | Accept team invitation |
| `/captcha` | POST | Captcha verification |
| `/2fa/verify` | POST | Two-factor verification |
| `/billing/webhook` | POST | Stripe webhook |
| `/billing/plans` | GET | List pricing plans |

#### Protected Endpoints (require JWT)
| Endpoint Group | Controller | Purpose |
|---|---|---|
| `/billing/*` | BillingController | Subscription, usage, payment methods, invoices |
| `/team/*` | TeamController | Team management, invitations |
| `/roles/*` | RoleController | Custom role CRUD |
| `/settings/*` | SettingsController | Workspace settings |
| `/security/*` | SecurityController | Password change, 2FA, sessions, IP blocking |
| `/api-keys/*` | ApiKeyController | API key management |
| `/workspace/*` | WorkspaceController | Workspace CRUD |
| `/appearance/*` | AppearanceController | Branding settings |
| `/branding/*` | BrandingController | Company branding |
| `/audit/*` | AuditController | Audit log viewing |
| `/permissions/*` | PermissionController | Permission listing |
| `/inquiries/*` | InquiryController | General inquiries |

### CRM Service (`/api/v1/crm/`)

**FACT (from controllers):**

| Controller | Key Endpoints | Purpose |
|---|---|---|
| CrmLeadController | CRUD leads, pipeline, convert, assign, activities | Lead management |
| CrmContactController | CRUD contacts, search, merge | Contact management |
| QuoteController | CRUD quotes, items, PDF, share, revisions, approve | Quote/proposal management |
| DashboardController | Stats, pipeline, revenue, conversion | CRM analytics |
| ActivityController | CRUD activities, timeline | Activity tracking |

### Event Service (`/api/v1/events/`)

**FACT (from controllers):**

| Controller | Key Endpoints | Purpose |
|---|---|---|
| EventController | CRUD events, days, venues, assignments, timeline, guests | Event management |
| BookingController | CRUD bookings, status, assignments, budget, timeline | Booking lifecycle |
| InvoiceController | CRUD invoices, line items, send, PDF, reminders | Invoice management |
| PaymentController | CRUD payments, transactions, summary | Payment tracking |
| VendorController | CRUD vendors, assignments, contracts, payments | Vendor management |
| BudgetController | CRUD budgets, categories, alerts, expenses | Budget management |
| BudgetCalculatorController | Public estimates, pricing rules, convert to lead | Budget calculator |
| EventDashboardController | Stats, upcoming, overdue, revenue | Event analytics |
| ClientPortalController | Client view of bookings, invoices, galleries, timeline | Client portal API |
| TemplateController | CRUD email templates | Template management |
| IntegrationController | CRUD integrations | Integration management |
| TaxController | CRUD tax settings | Tax configuration |
| NotificationPreferenceController | Notification settings | Notification preferences |
| PaymentEngineController | Payment processing | Payment engine |
| AuditLogController | Audit trail | Audit logging |
| BillingController | Billing profiles | Billing configuration |

### Gallery Service (`/api/v1/gallery/`)

**FACT (from controllers):**

| Controller | Key Endpoints | Purpose |
|---|---|---|
| AlbumController | CRUD albums, cover image, status, visibility | Album management |
| GalleryItemController | Upload, CRUD items, batch operations, watermark | Media management |
| ShareLinkController | Create/revoke links, access logs, download | Share link management |

Source: All controller files in `backend/*/src/main/java/com/eventos/*/controller/`
