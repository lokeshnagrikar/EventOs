# 🎪 EventOS — Enterprise Operating System for Events & Agencies

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Executive Summary

**EventOS** is an all-in-one, multi-tenant operating system built explicitly for event management agencies, wedding planning firms, concert producers, and venue operators.

It unifies client lead management, instant quote calculations, 1-click proposal PDF generation, run-of-show stage timelines, financial margin auditing, WhatsApp notification automation, and media photo booth galleries into a single high-performance platform.

---

## ✨ Key Feature Highlights

### 🏢 Multi-Tenant Workspace Engine
- **1-Second Workspace Switcher** (`WorkspaceSelectorPill.tsx`): Agency owners managing multiple brand identities can toggle workspace contexts instantly without re-authenticating.
- **Strict Data Isolation**: Enforces tenant-isolated PostgreSQL database scoping (`WHERE tenant_id = :tenantId`).

### 🔑 Frictionless Authentication & Onboarding
- **1-Click Returning User Profile Card**: Recognizes browser sessions for instant 1-second sign-in ("Welcome back, Lokesh!").
- **Email Domain Auto-Suggestion**: Real-time domain completion (`name@gma` ➔ `name@gmail.com`) to eliminate signup typos.
- **WhatsApp 6-Digit OTP**: Passwordless client sign-in via WhatsApp Business API.
- **Logout Confirmation Safeguard** (`LogoutConfirmationModal.tsx`): High-contrast obsidian warning dialog protecting users from accidental sign-outs.

### 📊 Financial Analytics & Margin Auditing
- **Live Profit Analytics Dashboard** (`EventFinancialAnalytics.tsx`): Real-time tracking of Gross Revenue (`₹48,50,000`), Production Costs (`₹28,20,000`), and Net Profit Margins (`41.9% Margin`).
- **Interactive Charts**: Monthly revenue vs. expense trends (Recharts AreaChart) and expense allocation breakdown (Recharts Donut).
- **Per-Event Profit Audit Table**: Audits net profitability and margin % per event contract.
- **Dynamic Currency Switcher**: 1-Click toggle between `₹ INR`, `$ USD`, and `€ EUR`.
- **Dynamic UPI QR Payment Modal** (`DynamicUpiQrModal.tsx`): Instant UPI QR payments with 15-minute countdown and VPA copy helper.

### 🧮 Instant Quote & Proposal PDF Generator
- **Event Budget Calculator** (`/quote-calculator`): Interactive cost calculator with guest sliders (50 to 5,000 guests) and custom add-on line items.
- **1-Click Proposal PDF Export**: Compiles itemized event costs into downloadable client proposal PDFs.

### 🎪 Operations & Run-of-Show Stage Manager
- **Live Event Calendar & Timeline**: Stage cue sheets for sound, lighting, pyrotechnics, and crew dispatch lists.
- **CRM Kanban Lead Pipeline** (`/crm`): Drag-and-drop lead stages (*New Lead* ➔ *Won*).

---

## 🏛️ System Architecture & Tech Stack

| Layer | Technology | Key Components |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript | Tailwind CSS, Framer Motion, Lenis Smooth Scroll, Recharts, Zustand |
| **API Gateway** | Spring Cloud Gateway | Port 8080, RSA-256 JWT Verification, CORS, Rate Limiting |
| **Microservices** | Java 21 / Spring Boot 3.x | `auth-service` (:8081), `crm-service` (:8082), `event-service` (:8083), `gallery-service` (:8084) |
| **Database & Cache** | PostgreSQL 17, Redis 7 | Schema-per-tenant isolation, JWT refresh session cache |
| **Message Broker** | RabbitMQ 3.13 | Asynchronous notification events & WhatsApp dispatch |
| **Media Storage** | Cloudinary CDN | Photo booth media storage & EXIF metadata extraction |
| **DevOps** | Docker, Kubernetes | Multi-stage Dockerfiles, resource limits (`-Xmx128m` heap per service) |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **Java OpenJDK**: v21
- **Maven**: v3.9.x
- **Docker Desktop** (Optional for container deployment)

### 1. Repository Setup & Environment
```bash
# Clone repository
git clone https://github.com/lokeshnagrikar/EventOs.git
cd EventOs

# Load local environment variables (PowerShell)
.\load_env.ps1
```

### 2. Run Next.js Frontend
```bash
cd web
npm install
npm run dev
# Web application available at http://localhost:3000
```

### 3. Run Backend Microservices (Local Java Jars)
```bash
# In separate terminal windows:
java -Xmx128m -jar backend/api-gateway/target/api-gateway-1.0.0.jar
java -Xmx128m -jar backend/auth-service/target/auth-service-1.0.0.jar
java -Xmx128m -jar backend/crm-service/target/crm-service-1.0.0.jar
java -Xmx128m -jar backend/event-service/target/event-service-1.0.0.jar
java -Xmx128m -jar backend/gallery-service/target/gallery-service-1.0.0.jar
```

---

## 🐳 One-Command Production Docker Launch

To launch the full production stack using tuned Docker containers:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Verify container status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 📚 Comprehensive Project Documentation

The repository includes complete technical and operational documentation:

- 🔑 **[Master Production Environment & API Guide](PRODUCTION_ENVIRONMENT_MASTER_GUIDE.md)**: Production API key reference sheet.
- 🧪 **[Frontend Manual Testing Checklist](docs/FRONTEND_MANUAL_TESTING_GUIDE.md)**: Step-by-step QA manual testing guide.
- 📖 **[Master Project Theory & Architectural Blueprint](docs/EVENTOS_COMPLETE_PROJECT_THEORY_SPEC.md)**: Architectural design specifications.
- 📑 **[Product Requirement Document (PRD) & Code Deep Dive](docs/EVENTOS_PRD_AND_CODE_DEEP_DIVE.md)**: Complete PRD & code execution flow breakdown.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
