# EventOS — Complete Codebase Master Context & Architecture Reference

> **Snapshot Date**: September 2026  
> **Version**: 2.2.0 (Containerized & Production Hardened)  
> **Source Document**: Synchronized with `d:\EventOs\PROJECT_CONTEXT_MASTER.md`

Please refer to the comprehensive root specification file:
👉 **[PROJECT_CONTEXT_MASTER.md](file:///d:/EventOs/PROJECT_CONTEXT_MASTER.md)**

### Quick Summary of System Architecture:
- **API Gateway (8080)**: Spring Cloud Gateway with dedicated WebSocket upgrade route (`/api/v1/auth/ws`).
- **Auth Service (8081)**: JWT, Google OAuth2, Spring STOMP WebSocket Message Broker, Multi-tenancy.
- **CRM Service (8082)**: Leads, interactive quotes/proposals, contacts, activity logs.
- **Event Service (8083)**: Event operations, run-of-show cue sheets, vendor management, milestone invoicing, payments ledger.
- **Gallery Service (8084)**: Dynamic Cloudinary watermarked proofing, PIN-protected shared galleries, client favoriting.
- **Web Frontend (3000)**: Next.js 15 App Router, React 19, Tailwind CSS, Zustand, Resilient Live Sync Engine.
- **Datastores & Queues**: PostgreSQL 17+, Redis 7.2, RabbitMQ 3.13.
- **Containerization**: Full Docker Compose setup with core 8-container backend and optional observability stack (Prometheus, Grafana, Loki, Tempo).
- **Marketing Assets**: Instagram carousel slides (4:5 portrait) and Founder DP in `web/public/instagram-posts/`.
