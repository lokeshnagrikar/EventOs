# EventOS Incident Response Runbook

This document defines the incident management procedures, severity classification (P1–P4), escalation matrix, and response lifecycle for the EventOS platform.

---

## 1. Incident Severity Classification

### **P1: Critical (Complete Outage)**
* **Description**: EventOS is completely down or unusable across multiple tenants. Key core features (Authentication, Invoicing, Bookings, Gallery share) are entirely unavailable with no workaround.
* **Response SLA**: Target response within **15 minutes**. Resolution within **4 hours**.
* **Trigger Conditions**:
  - API Gateway returns `502 Bad Gateway` or `503 Service Unavailable` for all requests.
  - Core database `eventos_root` is corrupted or unreachable.
  - Active security breach / data exfiltration in progress.

### **P2: Major (Degraded Operation / Single Tenant Outage)**
* **Description**: A major module is offline (e.g. users cannot approve quotes, or cannot upload media files), or a single high-profile tenant is experiencing a complete blockage.
* **Response SLA**: Target response within **30 minutes**. Resolution within **8 hours**.
* **Trigger Conditions**:
  - RabbitMQ broker is offline, halting async lead promotions.
  - Cloudinary integration is failing, blocking media uploads.

### **P3: Minor (Partial Impairment)**
* **Description**: Non-blocking business logic failure or minor feature bug (e.g. Grafana dashboard not updating, or light/dark theme flashing).
* **Response SLA**: Target response within **4 hours**. Resolution within **48 hours**.

### **P4: Low (Cosmetic / Documentation)**
* **Description**: General questions, minor typos, UI alignment adjustments.
* **Response SLA**: Target response within **24 hours**. Resolution in next planned deploy.

---

## 2. On-Call Escalation Matrix

When a P1 or P2 incident is triggered, follow the escalation chain until ownership is acknowledged:

```
  [Alert Triggered]
         │
         ▼
 1st Line: Site Reliability Engineer (SRE) / DevSecOps
         │ (No response in 10 minutes)
         ▼
 2nd Line: Principal Platform Engineer / Systems Architect
         │ (No response in 20 minutes)
         ▼
 3rd Line: VP of Engineering / Engineering Manager
```

### Communication Roles:
- **Incident Commander (IC)**: Responsible for directing the investigation, assigning remediation tasks to engineers, and approving rollback/hotfix deployments.
- **Communications Lead**: Responsible for updating internal stakeholders and publishing tenant status updates.

---

## 3. Incident Response Lifecycle

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  1. Detect   │ ───> │  2. Contain  │ ───> │  3. Mitigate │ ───> │ 4. Post-Mort │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
```

### **Step 1: Detection & Triage**
- Incident is detected via automated Grafana Alert Rules or Customer Support tickets.
- SRE initiates bridge channel and categorizes severity.

### **Step 2: Containment**
- Isolate affected components if possible (e.g., block offending IP ranges at Nginx, throttle calculator routes, or scale down gallery-service if Cloudinary is saturated).

### **Step 3: Mitigation**
- Apply quick remedies:
  - If database lock issues occur, run `restore.sh` or terminate locks.
  - If a bad release was pushed, execute rollback procedures (see [recovery_and_rollback.md](file:///d:/EventOs/operations/runbooks/recovery_and_rollback.md)).
  - Restart failed pods or clear cache.

### **Step 4: Post-Mortem & Preventative Actions**
- Conduct a blame-free post-mortem review within **48 hours** of resolution.
- Log details: Root Cause, Action Items, Timeline of events, and Sentry trace IDs.
