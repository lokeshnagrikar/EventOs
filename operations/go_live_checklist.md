# EventOS Go-Live Checklist & Readiness Gates

This document defines the Entry and Exit criteria gates and the step-by-step deployment timeline for executing the EventOS production launch.

---

## 1. Entry Criteria (Pre-Launch Gates)

Before initiating the deployment sequence, the following gates must be marked **Complete** and signed off by their respective leads:

- [ ] **Remediation Audits (100%)**: All microservice components (Budget Calculator, Payments, Gallery, Client Portal) have resolved security issues and score 97/100 or higher.
- [ ] **Infrastructure Sizing Verified**: Target cloud resources are provisioned in the production environment matching Tier 2 or 3 sizing specifications.
- [ ] **Staging Dry Run (Pass)**: The backup/restore scripts (`backup.sh`, `restore.sh`) and staging drills run successfully.
- [ ] **Security Checks (Clean)**: Gitleaks secrets scanning and Trivy image scanning report zero `HIGH` or `CRITICAL` issues in the build artifacts.
- [ ] **Offsite Storage Hook**: Cloudinary credentials and offsite database backup S3 variables are verified and active.
- [ ] **SSL Certificates Ready**: TLS certificates are provisioned and loaded into the production load balancer/ingress controller.

---

## 2. Go-Live Timeline & Step-by-Step Procedure

| Step | Phase | Task Description | Commands / Actions | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Prep | Declare maintenance window. Update client portals with maintenance banners. | Update DNS routing to static maintenance bucket. | Ops |
| **2** | Deploy | Build and push final images via CI/CD. | Trigger `.github/workflows/deploy.yml` on main. | Dev |
| **3** | Database | Spin up core backing databases. Verify empty states. | `helm install eventos-infra ./k8s/helm/eventos-infra` | DBA |
| **4** | Restore | Import final staging/migration data if needed, or run Flyway baseline. | Verify `mvn flyway:migrate` runs to clean schema. | DBA |
| **5** | Deploy | Spin up API Gateway and microservice pods in replicas. | `kubectl apply -f k8s/deployment.yaml -n eventos` | Ops |
| **6** | Telemetry | Verify Prometheus scraping is active. | Open Grafana (`http://grafana.prod.eventos.com/`) and check pool lines. | SRE |
| **7** | Network | Bind production DNS to active ingress controller routing. | Point `app.eventos.com` to K8s Ingress IP. | Ops |
| **8** | UAT | Execute live sanity checklist (Workflow 1). | Run manual checkout sanity checks. | QA |

---

## 3. Exit Criteria (Post-Launch Gates)

To declare the deployment successful and exit the Go-Live sprint, the following must be verified:

- [ ] **All Services Healthy**: Ingress and gateway health actuator checks return `200 OK` and status is `"UP"` for more than 10 consecutive minutes.
- [ ] **DNS Resolving**: `https://app.eventos.com` resolves globally with valid, non-expired TLS certificates.
- [ ] **Database Connection Pool Stable**: Grafana shows HikariCP active connection lines are steady with zero pool starvation errors.
- [ ] **Ledger Integrity**: Sanity test invoices and void operations run cleanly with reversing ledger transaction entries.
- [ ] **RabbitMQ Queue Zero-Backlog**: RabbitMQ queue metrics show events are consumed immediately with empty DLQs.
- [ ] **Telemetry Scrape Check**: Prometheus logs show metrics are successfully collected from all microservice endpoints.
- [ ] **Sign-off**: Formal approval received from System Architect, Security Lead, and Product Owner.
