# EventOS Microservices Architecture Document

Version: 1.0

Product:
EventOS

Tagline:
The Operating System For Event Businesses

Architecture Style:
Microservices

Deployment:
Docker + VPS

Cloud Ready:
Yes

---

# 1. Architecture Vision

EventOS must be:

* Modular
* Scalable
* Secure
* Multi-Tenant
* SaaS Ready
* AI Ready

The architecture should support:

10 Users
↓

100 Users
↓

1,000 Users
↓

10,000+ Users

without major redesign.

---

# 2. High-Level Architecture

Frontend

Next.js

↓

API Gateway

↓

Microservices

↓

Databases

↓

External Services

---

Architecture Flow

Client

↓

Next.js Frontend

↓

API Gateway

↓

Auth Service

CRM Service

Event Service

Quote Service

Payment Service

Gallery Service

Notification Service

Client Portal Service

↓

PostgreSQL

Redis

Cloudinary

WhatsApp

Email

---

# 3. Service List

Core Services

1. API Gateway

2. Auth Service

3. CRM Service

4. Event Service

5. Quote Service

6. Payment Service

7. Gallery Service

8. Notification Service

9. Client Portal Service

10. Reporting Service

Future Services

11. AI Service

12. Marketplace Service

13. Automation Service

---

# 4. API Gateway

Purpose

Single entry point for all APIs.

Responsibilities

Routing

Authentication

Rate Limiting

Logging

Request Validation

API Aggregation

Technology

Spring Cloud Gateway

---

Routes

/api/auth/**

/api/crm/**

/api/events/**

/api/quotes/**

/api/payments/**

/api/gallery/**

/api/client/**

---

# 5. Auth Service

Purpose

Identity Management

Responsibilities

Registration

Login

JWT Generation

Refresh Tokens

Password Reset

Email Verification

Roles

Admin

Manager

Staff

Client

Database

auth_db

---

Tables

users

roles

permissions

refresh_tokens

---

# 6. CRM Service

Purpose

Lead Management

Responsibilities

Lead Creation

Lead Tracking

Lead Conversion

Follow Ups

Notes

Assignments

Database

crm_db

---

Tables

leads

lead_activities

lead_notes

lead_sources

---

# 7. Event Service

Purpose

Event Operations

Responsibilities

Events

Bookings

Timelines

Assignments

Calendar

Database

event_db

---

Tables

events

bookings

event_timelines

event_assignments

tasks

---

# 8. Quote Service

Purpose

Quotation System

Responsibilities

Create Quotes

Manage Templates

Generate PDFs

Client Approval

Database

quote_db

---

Tables

quotes

quote_items

quote_templates

---

# 9. Payment Service

Purpose

Financial Operations

Responsibilities

Payments

Invoices

Transactions

Revenue Tracking

Database

payment_db

---

Tables

payments

invoices

transactions

subscription_payments

---

# 10. Gallery Service

Purpose

Media Management

Responsibilities

Upload

Storage

Albums

Sharing

Cloudinary Sync

Database

gallery_db

---

Tables

albums

media_files

shared_links

---

# 11. Notification Service

Purpose

Communication Layer

Responsibilities

Emails

WhatsApp

In-App Notifications

Future SMS

Database

notification_db

---

Tables

notifications

email_logs

whatsapp_logs

---

# 12. Client Portal Service

Purpose

Client Experience

Responsibilities

Portal Dashboard

Quotes

Invoices

Payments

Gallery Access

Timeline

Database

client_portal_db

---

Tables

portal_access

client_sessions

---

# 13. Reporting Service

Purpose

Business Intelligence

Responsibilities

Analytics

Reports

Exports

KPIs

Dashboard Metrics

Database

reporting_db

---

Tables

aggregated_metrics

daily_reports

monthly_reports

---

# 14. Database Strategy

Preferred

Database Per Service

Benefits

Isolation

Scalability

Security

Independent Deployment

---

Example

auth_db

crm_db

event_db

quote_db

payment_db

gallery_db

notification_db

---

# 15. Inter-Service Communication

Synchronous

REST APIs

Used For

Immediate Requests

Authentication

Client Validation

Permission Checks

---

Asynchronous

RabbitMQ

Used For

Notifications

Payments

Events

Activity Tracking

Automation

---

# 16. RabbitMQ Events

LeadCreated

LeadAssigned

QuoteCreated

QuoteApproved

BookingCreated

PaymentReceived

InvoiceGenerated

GalleryUploaded

EventCompleted

---

# 17. Redis Layer

Purpose

Caching

Session Management

Rate Limiting

Temporary Storage

---

Cache Examples

Dashboard Metrics

Company Settings

User Permissions

Subscription Data

---

# 18. Cloudinary Integration

Storage Types

Images

Videos

Documents

Invoices

---

Folder Structure

/company-id

/events

/gallery

/quotes

/invoices

---

# 19. Security Architecture

Authentication

JWT

Refresh Token

---

Authorization

RBAC

Permission Based

---

Security Layers

HTTPS

Rate Limiting

CORS

Validation

Audit Logs

Encryption

---

# 20. Multi-Tenant Strategy

Every Request Contains

Tenant ID

Company ID

User ID

---

Isolation

Tenant Filtering

Database Queries

Permission Validation

---

Future

Custom Domains

White Labeling

---

# 21. Monitoring Architecture

Metrics

Prometheus

---

Dashboards

Grafana

---

Logs

ELK Stack

Future

OpenSearch

---

# 22. Error Tracking

Sentry

Capture

Backend Errors

Frontend Errors

API Errors

Performance Issues

---

# 23. CI/CD Pipeline

GitHub Push

↓

GitHub Actions

↓

Build

↓

Test

↓

Docker Image

↓

Deploy VPS

↓

Health Check

↓

Production

---

# 24. Docker Architecture

Containers

Frontend

API Gateway

Auth Service

CRM Service

Event Service

Quote Service

Payment Service

Gallery Service

Notification Service

PostgreSQL

Redis

RabbitMQ

Nginx

---

# 25. Production Infrastructure

VPS

Ubuntu 24

---

Nginx

Reverse Proxy

SSL

Load Balancer Ready

---

Docker Compose

Container Management

---

# 26. AI Service (Phase 3)

Purpose

AI Features

Responsibilities

AI Quote Generator

AI Event Planner

AI Budget Estimator

AI Lead Scoring

AI Insights

Database

ai_db

---

# 27. Marketplace Service (Phase 4)

Purpose

Vendor Marketplace

Responsibilities

Vendor Listings

Vendor Search

Bookings

Reviews

Marketplace Payments

Database

marketplace_db

---

# 28. Scalability Roadmap

Phase 1

Monolith-Like Microservices

Single VPS

---

Phase 2

Separate Databases

Dedicated Redis

Dedicated RabbitMQ

---

Phase 3

Kubernetes

Auto Scaling

Multi Region

---

# 29. Disaster Recovery

Daily Database Backups

Cloudinary Backups

Monitoring Alerts

Rollback Strategy

Health Checks

---

# 30. Final Architecture Principles

API First

Microservice Ready

Cloud Ready

AI Ready

Marketplace Ready

Multi-Tenant SaaS Ready

Production Ready

Enterprise Expandable
