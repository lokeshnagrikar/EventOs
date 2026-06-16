# EventOS Technical Requirements Document (TRD)

Version: 1.0

Product:
EventOS

Tagline:
The Operating System For Event Businesses

---

# 1. Technical Overview

EventOS will be developed as a modern SaaS platform using a scalable microservices architecture.

Primary Goals:

* High Performance
* Multi-Tenant SaaS Ready
* Secure Authentication
* Cloud Storage Integration
* Modular Services
* Future AI Integration

---

# 2. Technology Stack

Frontend

Framework:
Next.js 16

Language:
TypeScript

UI:
shadcn/ui

Styling:
Tailwind CSS

State Management:
Zustand

Server State:
TanStack Query

Forms:
React Hook Form

Validation:
Zod

Animations:
Framer Motion
GSAP

Icons:
Iconify

Premium Components:
21st.dev
Magic UI

---

Backend

Framework:
Spring Boot 3

Language:
Java 21

Security:
Spring Security

Authentication:
JWT

Authorization:
Role Based Access Control (RBAC)

API:
REST

Documentation:
OpenAPI / Swagger

Build Tool:
Maven

---

Database

Primary Database:
PostgreSQL

ORM:
Spring Data JPA

Migration:
Flyway

Connection Pool:
HikariCP

Caching:
Redis

---

Storage

Media Storage:
Cloudinary

Files:

Images

Videos

Documents

Invoices

Quotation PDFs

---

Notifications

Email

Spring Mail

SMTP

WhatsApp

WhatsApp Business API

Future:

Push Notifications

SMS

---

Deployment

Containerization:
Docker

Reverse Proxy:
Nginx

Hosting:
VPS

CI/CD:
GitHub Actions

Monitoring:
Prometheus

Logs:
Grafana

---

# 3. Architecture Overview

Architecture Type:

Microservices

Services:

Auth Service

CRM Service

Event Service

Quote Service

Payment Service

Gallery Service

Notification Service

Client Portal Service

API Gateway

---

# 4. Authentication System

Authentication Method:

JWT

Token Types:

Access Token

Refresh Token

---

User Roles

Admin

Manager

Staff

Client

---

Authentication Features

Register

Login

Logout

Forgot Password

Reset Password

Email Verification

Refresh Token

Session Management

---

# 5. Authorization Model

Admin

Full Access

Manager

Department Access

Staff

Assigned Records

Client

Own Data Only

---

# 6. API Design Standards

Base URL

/api/v1

---

Example

/api/v1/auth

/api/v1/leads

/api/v1/events

/api/v1/quotes

---

HTTP Standards

GET

POST

PUT

PATCH

DELETE

---

Response Format

Success

{
"success": true,
"data": {}
}

Error

{
"success": false,
"message": ""
}

---

# 7. Frontend Architecture

App Router

Use Next.js App Router

---

Folder Structure

src/

app/

components/

features/

hooks/

services/

lib/

store/

types/

constants/

providers/

utils/

---

Features Folder

auth

dashboard

crm

leads

events

quotes

payments

gallery

client-portal

settings

---

# 8. Dashboard Module

Widgets

Revenue

Upcoming Events

Pending Payments

Recent Leads

Pending Quotes

Activity Feed

---

Charts

Monthly Revenue

Bookings

Lead Conversion

Event Trends

---

# 9. CRM Module

Features

Lead Creation

Lead Pipeline

Lead Tracking

Lead Assignment

Lead Notes

Lead Follow-Ups

---

Lead Statuses

New

Contacted

Quotation Sent

Negotiation

Booked

Completed

Lost

---

# 10. Events Module

Features

Create Event

Update Event

Delete Event

Calendar View

Timeline View

---

Event Types

Wedding

Birthday

Engagement

Corporate

Private

---

# 11. Quotes Module

Features

Create Quote

Update Quote

Send Quote

Approve Quote

Reject Quote

Duplicate Quote

PDF Export

---

Quote Sections

Decoration

Lighting

Pyro

Photography

Venue

Custom Services

---

# 12. Budget Calculator Module

Inputs

Event Type

Guest Count

Venue Type

Decor Style

Effects

---

Outputs

Estimated Cost

Suggested Package

Additional Services

---

# 13. Payments Module

Features

Payment Tracking

Advance Payments

Remaining Balance

Payment History

Receipts

---

Statuses

Pending

Partial

Paid

Overdue

Refunded

---

# 14. Invoice Module

Features

Generate Invoice

PDF Download

Client Sharing

Payment Tracking

Tax Calculation

---

# 15. Gallery Module

Features

Upload Images

Upload Videos

Album Creation

Album Sharing

Cloudinary Integration

---

Storage Structure

Company

Event

Album

Media

---

# 16. Client Portal

Client Access

Quotes

Invoices

Payments

Timeline

Gallery

Documents

---

Client Permissions

Read Only

Own Records Only

---

# 17. Notification Service

Email Events

Welcome Email

Quote Sent

Payment Reminder

Event Reminder

Invoice Generated

---

WhatsApp Events

New Lead

Booking Confirmed

Payment Reminder

Quote Approved

---

# 18. Security Requirements

Password Hashing

BCrypt

---

HTTPS

Mandatory

---

CORS

Restricted Origins

---

Rate Limiting

Enabled

---

Input Validation

Zod
Bean Validation

---

SQL Injection Protection

JPA Parameterized Queries

---

# 19. Performance Requirements

API Response

< 500ms

---

Dashboard Load

< 2 Seconds

---

Media Upload

Async Processing

---

Pagination

Required

---

Caching

Redis

---

# 20. Multi-Tenant SaaS Design

Every record belongs to:

Tenant

Company

User

---

Isolation Strategy

Tenant ID

Company ID

Role Validation

---

Future

Custom Domains

White Labeling

Custom Branding

---

# 21. Logging & Monitoring

Application Logs

Spring Boot Logging

---

Metrics

Prometheus

---

Dashboard

Grafana

---

Error Tracking

Sentry

---

# 22. Backup Strategy

Database Backup

Daily

---

Media Backup

Cloudinary

---

Retention

30 Days

---

# 23. Future Technical Roadmap

Phase 2

WhatsApp Automation

Calendar Sync

Task Management

---

Phase 3

AI Quote Generator

AI Event Planner

AI Budget Estimator

AI CRM Insights

---

Phase 4

Marketplace

Vendor Discovery

Vendor Booking

Customer Marketplace

---

# 24. Technical Success Criteria

99.9% Uptime

Secure Authentication

Multi-Tenant Support

Scalable Microservices

Cloud Media Storage

Production Ready Deployment

Mobile Responsive UI

Future AI Compatibility
