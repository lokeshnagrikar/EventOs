# EventOS — Database & Data Model

## Database Architecture

**FACT:** Each microservice has its own dedicated PostgreSQL database. Database migrations are managed via versioned Flyway SQL scripts (`db/migration/V*__*.sql`, e.g., up to V41 in `auth-service` and V11 in `crm-service`), with Spring Data JPA / Hibernate entities mapping the schema.

| Database | Service | Entity Count |
|---|---|---|
| `auth_db` | auth-service | 26 entities |
| `crm_db` | crm-service | 10 entities |
| `event_db` | event-service | 42 entities |
| `gallery_db` | gallery-service | 7 entities |
| `payment_db` | (unused) | 0 entities |

---

## Auth Service Entities (`auth_db`)

**FACT (from `auth-service/entity/`):**

### Core Entities
| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| User | `users` | id (UUID), firstName, lastName, email, phone, passwordHash, profileImage, status, lastLogin, failedLoginAttempts, lockedUntil, isEmailVerified, emailVerificationToken, passwordUpdatedAt | User accounts |
| Tenant | `tenants` | id (UUID), name, subscriptionPlan, subscriptionStatus, maxUsers, maxStorage | Workspace/tenant isolation |
| Company | `companies` | id (UUID), tenantId, name, logoUrl, email, phone, website, address, gstNumber, slug, timezone, currency, primaryColor, secondaryColor, accentColor, gradientPresets, fontSelection, whatsappConfig, emailBranding, invoiceBranding, pdfBranding | Company/workspace profile |
| Membership | `memberships` | id, userId, tenantId, companyId, role, status | User ↔ Workspace association |

### Auth & Session Entities
| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| Session | `sessions` | id, userId, tenantId, ipAddress, userAgent, expiresAt | Active user sessions |
| RefreshToken | `refresh_tokens` | id, userId, token, expiresAt | JWT refresh tokens |
| PasswordHistory | `password_history` | id, userId, passwordHash | Prevent password reuse |
| User2Fa | `user_2fa` | id, userId, secret, enabled | TOTP 2FA config |

### Authorization Entities
| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| Role | `roles` | id, tenantId, name, description, permissions, isSystem | Custom workspace roles |
| Invitation | `invitations` | id, tenantId, email, role, token, status, expiresAt | Team invitations |
| ApiKey | `api_keys` | id, tenantId, keyHash, name, permissions | Developer API keys |

### Billing Entities
| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| Plan | `plans` | id, name, code, price, currency, billingInterval, maxUsers, maxStorage, maxGalleryUploads, maxEvents, maxLeads, maxAiCredits, maxAutomationRuns, maxApiCalls, customDomainSupported, whiteLabelSupported | Subscription plans |
| Subscription | `subscriptions` | id, tenantId, planId, status, trialStart/End, currentPeriodStart/End, cancelAtPeriodEnd | Active subscriptions |
| TenantUsage | `tenant_usage` | id, tenantId, usersCount, storageBytes, galleryUploads, eventsCount, leadsCount, aiCreditsUsed, automationRuns, apiCalls, emailsSent, smsSent | Usage metering |
| BillingHistory | `billing_history` | id, tenantId, planName, amount, type, description | Billing event log |
| Invoice (auth) | `invoices` | id, tenantId, invoiceNumber, amount, tax, currency, status, pdfUrl | Platform invoices |
| PaymentMethod | `payment_methods` | id, tenantId, type, provider, last4, cardBrand, isDefault | Stored payment methods |
| PlatformCoupon | `platform_coupons` | id, code, discount, type, expiresAt | Promotional coupons |

### Platform Entities
| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| FeatureFlag | `feature_flags` | id, name, enabled, description | Feature toggles |
| PlatformAnnouncement | `platform_announcements` | id, title, message, type | System announcements |
| SupportTicket | `support_tickets` | id, tenantId, userId, subject, description, status, priority | Support tickets |
| AuditLog | `audit_logs` | id, tenantId, userId, action, entityType, entityId, details | Audit trail |
| BlacklistedIp | `blacklisted_ips` | id, ipAddress, reason, expiresAt | IP blocking |
| DatabaseBackupRecord | `database_backup_records` | id, filename, size, status | Backup tracking |
| Inquiry | `inquiries` | id, name, email, message | General inquiries |
| WorkspaceSettings | `workspace_settings` | id, tenantId, customDomain, whiteLabelEnabled, customLoginUrl | White-label settings |

---

## CRM Service Entities (`crm_db`)

**FACT (from `crm-service/entity/`):**

| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| Lead | `leads` | id (UUID), companyId, assignedUserId, name, contactId (FK), leadSource, eventType, eventDate, budget, status, notes | Yes (extends AbstractTenantAwareEntity) |
| Contact | `contacts` | id (UUID), name, email, phone, company | Yes |
| Quote | `quotes` | id (UUID), leadId, quoteNumber, shareToken, status, templateName, subtotal, discount, tax, total, clientNotes, termsConditions, pdfUrl, parentQuoteId, revisionNumber | Yes |
| QuoteItem | `quote_items` | id, quoteId (FK), name, description, quantity, unitPrice, total | Part of Quote |
| Activity | `activities` | id, leadId, type, notes, timestamp | Yes |
| AuditLog | `audit_logs` | id, action, entityType, entityId, details | Yes |
| TenantSequence | `tenant_sequences` | id, tenantId, sequenceType, currentValue | Sequential numbering |

### Enums
- **LeadStatus:** NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, WON, LOST
- **QuoteStatus:** DRAFT, SENT, VIEWED, APPROVED, REJECTED, EXPIRED

---

## Event Service Entities (`event_db`)

**FACT (from `event-service/entity/`):**

### Core Event Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| Event | `events` | id (UUID), name, type, status, startDate, endDate, location, venueName, venueAddress, guestCount, guestList, budget, notes, bookingId | Yes |
| EventDay | `event_days` | id, eventId (FK), date, description | Part of Event |
| EventVenue | `event_venues` | id, eventId (FK), name, address | Part of Event |
| EventAssignment | `event_assignments` | id, eventId, userId, role | Yes |

### Booking Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| Booking | `bookings` | id (UUID), leadId, quoteId, clientId, clientName/Email/Phone, eventType, eventId, bookingNumber (unique per tenant), status, contractUrl, totalAmount, paidAmount, version | Yes |
| BookingAssignment | `booking_assignments` | id, bookingId, userId, role | Yes |
| BookingAuditLog | `booking_audit_logs` | id, bookingId, action, details | Yes |
| BookingTimelineEvent | `booking_timeline_events` | id, bookingId, type, description, timestamp | Part of Booking |
| BookingBudget | `booking_budgets` | id, bookingId, category, amount | Yes |

### Financial Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| Invoice | `invoices` | id (UUID), bookingId, eventId, invoiceNumber, clientName/Email/Phone, subtotal, discount, tax, taxPercentage, total, status, notes, dueDate, paidAt, termsConditions, pdfUrl, sentAt | Yes |
| InvoiceHistory | `invoice_histories` | id, invoiceId, action, details | Yes |
| Payment | `payments` | id (UUID), bookingId, invoiceId, amount, method, transactionId, notes, status | Yes |
| Transaction | `transactions` | id, bookingId, type, amount, description | Yes |
| Expense | `expenses` | id, eventId, category, amount, description, vendor | Yes |
| BillingProfile | `billing_profiles` | id, tenantId, companyName, gst, address | Yes |
| TaxSettings | `tax_settings` | id, tenantId, taxName, taxPercentage, isDefault | Yes |

### Budget Calculator Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| BudgetEstimate | `budget_estimates` | id, sessionId, eventType, guestCount, location, totalEstimate, breakdown | No (public) |
| BudgetCategoryAllocation | `budget_category_allocations` | id, estimateId, category, percentage, amount | Part of Estimate |
| BudgetAlert | `budget_alerts` | id, bookingId/eventId, type, threshold, message | Yes |
| PricingRule | `pricing_rules` | id, tenantId, category, type, basePrice, perGuestPrice | Yes |

### Vendor Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| Vendor | `vendors` | id, name, category, contactName, email, phone, rating | Yes |
| VendorAssignment | `vendor_assignments` | id, vendorId, eventId, role, fee, status | Yes |
| VendorContract | `vendor_contracts` | id, vendorId, eventId, contractUrl, amount, signedDate, expiryDate, status, terms, advancePaid, balanceDue, paymentStatus | Yes |

### Timeline Entities
| Entity | Table | Key Fields | Tenant-Scoped |
|---|---|---|---|
| TimelineTask | `timeline_tasks` | id, eventId, bookingId, title, description, startTime, endTime, category, status, priority, assignedUserId, completed, orderIndex, parentTaskId | Yes |
| EventTimelineItem | `event_timeline_items` | id, eventId, time, title, description, category, orderIndex | Yes |

### Other Entities
| Entity | Table | Purpose |
|---|---|---|
| EmailTemplate | `email_templates` | Customizable email templates |
| Integration | `integrations` | Third-party integration configs |
| TenantSequence | `tenant_sequences` | Sequential numbering per tenant |

### Enums (Event Service)
- **EventType:** WEDDING, CORPORATE, BIRTHDAY, SOCIAL, CONFERENCE, OTHER
- **EventStatus:** PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **BookingStatus:** INQUIRY, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **TaskStatus:** TODO, IN_PROGRESS, COMPLETED
- **TaskPriority:** LOW, MEDIUM, HIGH, URGENT
- **VendorCategory:** CATERING, DECORATION, PHOTOGRAPHY, MUSIC, VENUE, LIGHTING, TRANSPORT, OTHER
- **VendorPaymentStatus:** PENDING, PARTIAL, PAID, OVERDUE
- **BudgetCategory:** VENUE, CATERING, DECORATION, PHOTOGRAPHY, ENTERTAINMENT, TRANSPORT, ACCOMMODATION, MISCELLANEOUS
- **PricingCategory:** Same as BudgetCategory
- **PricingType:** FIXED, PER_GUEST
- **MilestoneType:** BOOKING, PLANNING, EXECUTION, COMPLETION
- **AlertType:** WARNING, CRITICAL, INFO

---

## Gallery Service Entities (`gallery_db`)

**FACT (from `gallery-service/entity/`):**

| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| Album | `albums` | id (UUID), tenantId, name, description, eventId, status, visibility, coverImage | Photo album container |
| GalleryItem | `gallery_items` | id (UUID), albumId, tenantId, type, originalUrl, thumbnailUrl, watermarkedUrl, fileName, fileSize, mimeType, width, height, tags, caption, orderIndex | Individual media item |
| ShareLink | `share_links` | id (UUID), albumId, tenantId, token, expiresAt, maxViews, currentViews, passwordHash, allowDownload, isActive | Shareable album link |
| ShareLinkAccessLog | `share_link_access_logs` | id, shareLinkId, ipAddress, userAgent, accessedAt | Access tracking |

### Enums (Gallery Service)
- **AlbumStatus:** DRAFT, PUBLISHED, ARCHIVED
- **AlbumVisibility:** PRIVATE, SHARED, PUBLIC
- **GalleryItemType:** PHOTO, VIDEO

---

## Conceptual Relationship Map

**FACT:**

```
User
├── Membership → Tenant / Company (workspace)
├── Session
├── RefreshToken
├── User2Fa
└── PasswordHistory

Tenant (Workspace)
├── Company (workspace profile)
├── Membership (users)
├── Subscription → Plan
├── TenantUsage
├── Role
├── Invitation
├── ApiKey
├── WorkspaceSettings
└── (scopes all service data via tenantId)

Lead (CRM)
├── Contact
├── Activity
├── Quote → QuoteItem
└── → Booking (via RabbitMQ on acceptance)

Booking (Event)
├── Event → EventDay, EventVenue, EventAssignment
├── Invoice → InvoiceHistory, Payment
├── TimelineTask
├── BookingTimelineEvent
├── BookingAssignment
├── BookingAuditLog
├── BookingBudget
└── VendorAssignment → VendorContract

Album (Gallery)
├── GalleryItem
└── ShareLink → ShareLinkAccessLog
```

Source: All entity files across `backend/*/src/main/java/com/eventos/*/entity/`
