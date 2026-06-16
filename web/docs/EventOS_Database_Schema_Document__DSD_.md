# EventOS Database Schema Document (DSD)

Version: 1.0

Database:
PostgreSQL 17+

Architecture:
Multi-Tenant SaaS

ORM:
Spring Data JPA + Hibernate

Migration:
Flyway

---

# 1. Database Design Principles

Goals:

* Multi-Tenant Ready
* Scalable
* Auditable
* Secure
* Soft Delete Support
* Future SaaS Expansion

Every business account is treated as a Tenant.

Each record belongs to:

Tenant
↓
Company
↓
User

---

# 2. Common Audit Fields

Every table contains:

id UUID PRIMARY KEY

created_at TIMESTAMP

updated_at TIMESTAMP

created_by UUID

updated_by UUID

is_deleted BOOLEAN

tenant_id UUID

---

# 3. Core Entity Relationships

Tenant
└── Company
├── Users
├── Leads
├── Clients
├── Events
├── Bookings
├── Quotes
├── Payments
├── Invoices
├── Galleries
├── Tasks
└── Notifications

---

# 4. Tenant Table

tenant

id

name

subscription_plan

subscription_status

max_users

max_storage

created_at

---

# 5. Company Table

company

id

tenant_id

name

logo_url

email

phone

website

address

city

state

country

gst_number

timezone

currency

created_at

---

# 6. Users Table

users

id

tenant_id

company_id

first_name

last_name

email

phone

password_hash

profile_image

role_id

status

last_login

created_at

---

# 7. Roles Table

roles

id

name

description

permissions_json

created_at

Examples:

Admin

Manager

Staff

Client

---

# 8. Permissions Table

permissions

id

module_name

action_name

description

Examples:

lead_create

lead_update

quote_send

payment_update

---

# 9. Lead Table

leads

id

tenant_id

company_id

assigned_user_id

lead_source

name

phone

email

event_type

event_date

budget

status

notes

created_at

---

# 10. Lead Activity Table

lead_activities

id

lead_id

activity_type

description

created_by

created_at

Examples:

Call

WhatsApp

Meeting

Email

Follow-up

---

# 11. Clients Table

clients

id

tenant_id

company_id

name

phone

email

address

notes

status

created_at

---

# 12. Events Table

events

id

tenant_id

company_id

client_id

event_name

event_type

event_date

venue_name

venue_address

guest_count

budget

status

description

created_at

---

# 13. Event Timeline Table

event_timelines

id

event_id

title

description

timeline_date

status

created_at

Examples:

Planning

Decoration Setup

Photography

Main Event

Completion

---

# 14. Bookings Table

bookings

id

tenant_id

company_id

event_id

booking_number

booking_date

status

advance_amount

total_amount

remaining_amount

created_at

---

# 15. Quote Table

quotes

id

tenant_id

company_id

client_id

event_id

quote_number

subtotal

discount

tax

total_amount

status

expiry_date

created_at

---

# 16. Quote Items Table

quote_items

id

quote_id

service_name

description

quantity

unit_price

total_price

Examples:

Stage Decoration

Cold Pyro

Smoke Entry

Photography

DJ

Lighting

---

# 17. Budget Calculator Table

budget_calculations

id

tenant_id

user_id

event_type

guest_count

venue_type

decor_style

effects_selected

estimated_cost

created_at

---

# 18. Payments Table

payments

id

tenant_id

booking_id

client_id

amount

payment_method

transaction_reference

status

payment_date

notes

created_at

---

# 19. Invoices Table

invoices

id

tenant_id

booking_id

invoice_number

subtotal

tax

total_amount

due_date

status

pdf_url

created_at

---

# 20. Gallery Albums Table

gallery_albums

id

tenant_id

event_id

title

description

cover_image

created_at

---

# 21. Media Files Table

media_files

id

album_id

cloudinary_public_id

file_url

file_type

file_size

uploaded_by

created_at

file_type:

IMAGE

VIDEO

DOCUMENT

---

# 22. Team Members Table

team_members

id

tenant_id

user_id

designation

joining_date

salary_type

status

created_at

---

# 23. Event Assignments Table

event_assignments

id

event_id

team_member_id

assignment_type

status

assigned_at

Examples:

Decorator

Photographer

Videographer

Coordinator

---

# 24. Tasks Table

tasks

id

tenant_id

assigned_to

event_id

title

description

priority

status

due_date

created_at

---

# 25. Notifications Table

notifications

id

tenant_id

user_id

title

message

channel

status

created_at

channel:

EMAIL

WHATSAPP

IN_APP

---

# 26. Client Portal Access Table

client_portal_access

id

client_id

user_id

portal_enabled

last_login

created_at

---

# 27. Subscription Plans Table

subscription_plans

id

name

monthly_price

yearly_price

max_users

max_storage

features_json

created_at

---

# 28. Subscription Table

subscriptions

id

tenant_id

plan_id

start_date

end_date

status

payment_status

created_at

---

# 29. Audit Logs Table

audit_logs

id

tenant_id

user_id

entity_name

entity_id

action

old_values

new_values

created_at

Examples:

CREATE

UPDATE

DELETE

LOGIN

EXPORT

---

# 30. API Keys Table (Future)

api_keys

id

tenant_id

key_name

hashed_key

status

expires_at

created_at

---

# 31. Indexing Strategy

Create indexes on:

tenant_id

company_id

user_id

client_id

event_id

booking_id

quote_id

payment_date

event_date

status

email

phone

---

# 32. Soft Delete Strategy

Instead of deleting records:

is_deleted = true

Benefits:

Recovery

Auditability

Compliance

---

# 33. Data Retention Policy

Audit Logs:
3 Years

Payments:
7 Years

Invoices:
7 Years

Media:
Configurable

---

# 34. Future Database Extensions

Phase 2

WhatsApp Conversations

Calendar Sync

Automation Rules

---

Phase 3

AI Recommendations

AI Lead Scoring

AI Budget Optimization

---

Phase 4

Marketplace Vendors

Vendor Bookings

Customer Marketplace

---

# Database Summary

Estimated MVP Tables:

30+

Estimated Relationships:

50+

Multi-Tenant Ready:

YES

SaaS Ready:

YES

Microservice Compatible:

YES

Production Ready:

YES
