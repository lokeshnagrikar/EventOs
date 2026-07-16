# EventOS Production Readiness & Deployment Checklist

This checklist documents the configurations, recovery strategies, and deployment configurations required to run EventOS reliably in high-scale production environments.

---

## 1. High Availability & Resiliency Controls

- **[✓] Graceful Web Server Shutdown**:
  - Configured `server.shutdown: graceful` across all services. When SIGTERM is received, the Tomcat container stops accepting new requests but completes ongoing requests within a 30-second window.
- **[✓] Kubernetes Lifecycle Probes**:
  - Configured `management.endpoint.health.probes.enabled: true` to expose `/actuator/health/liveness` and `/actuator/health/readiness` endpoints. Kubernetes uses these to determine container health and routing state.
- **[✓] Circuit Breakers & Retries**:
  - Configured `resilience4j.circuitbreaker` instances on all downstream service-to-service calls.
  - Enabled exponential backoff retries (`retry.instances.default`) for resilient event publishing.
- **[✓] Dead Letter Queue (DLQ) Setup**:
  - Configured RabbitMQ exchanges with dead-letter bindings (`x-dead-letter-exchange` and `x-dead-letter-routing-key`). Failed events automatically route to dead-letter queues to prevent infinite message loop consumer blocks.

---

## 2. Database Backup & Disaster Recovery (DR)

- **[ ] Continuous Write-Ahead Log (WAL) Archiving**:
  - Enable Postgres WAL streaming to an offsite secure storage bucket (e.g. AWS S3 via PgBackRest or Barman) for point-in-time recovery (PITR).
- **[ ] Daily Scheduled Backups**:
  - Configure cron jobs executing encrypted `pg_dump` outputs daily:
    ```bash
    pg_dump -U eventos_admin -h localhost -p 5433 -F c -b -v -f "/backup/db_$(date +%F).dump" crm_db
    ```
- **[ ] SLA Recovery Objectives**:
  - **Recovery Point Objective (RPO)**: <= 1 hour (via WAL logs).
  - **Recovery Time Objective (RTO)**: <= 15 minutes (via automated stand-by replica promotions).

---

## 3. Zero-Downtime Blue-Green Deployments

- **[ ] Database Schema Evolution (Expand/Contract Pattern)**:
  - When modifying database tables via Flyway, split changes into two phases:
    1. **Expand**: Deploy new columns or tables as nullable or default-valued. Deploy new code that writes to *both* old and new schemas.
    2. **Contract**: Migrate old data, deploy new code reading *only* from new schemas, then deploy a final migration dropping old columns.
- **[ ] Gateway Ingress Routing**:
  - Configure the API Gateway or Kubernetes Ingress Controller (e.g., NGINX Ingress, Traefik) to dynamically split traffic between active `blue` and standby `green` environments during deployment phases:
    ```yaml
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
    ```

---

## 4. Environment & Secrets Management

- **[ ] External Secret Managers**:
  - Restrict hardcoding secrets (e.g., JWT private keys, database passwords, SMTP keys) inside application config files. Resolve properties at launch using secure vaults (Vault, AWS Parameter Store, GCP Secret Manager):
    ```yaml
    spring:
      config:
        import: "optional:vault://"
    ```
- **[ ] Profile Separations**:
  - Maintain absolute profile isolation. Deploy services with active system properties:
    - `-Dspring.profiles.active=prod`
  - Restrict Dev settings (`create-drop` database states, debug tracing) from prod deployment pipelines.
