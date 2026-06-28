# EventOS Service Recovery & Rollback Playbook

This runbook outlines step-by-step procedures to recover failed EventOS containers, diagnose microservice issues, and roll back deployments.

---

## 1. Quick-Diagnosis Commands

Before performing a rollback, extract trace details using these standard queries:

### Docker Compose Environment:
* **Check Service Status**:
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
* **View Microservice Logs (with trace ID correlation)**:
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f --tail=100 crm-service
  ```
* **Inspect Container Crash Details**:
  ```bash
  docker inspect eventos-api-gateway | grep State -A 5
  ```

### Kubernetes Environment:
* **Check Pod Restarts / Health**:
  ```bash
  kubectl get pods -n eventos -o wide
  ```
* **Fetch Detailed Logs for Trace Correlation**:
  ```bash
  kubectl logs -n eventos deployment/event-service --tail=200
  ```
* **Inspect Pod Events for CrashLoopBackOff**:
  ```bash
  kubectl describe pod <pod_name> -n eventos
  ```

---

## 2. Deployment Rollback Procedures

If a newly deployed version introduces critical bugs, memory leaks, or fails schema validation, roll back to the previously stable image tag.

### Scenario A: Rollback via Kubernetes
1. **Identify Previous Revision ID**:
   ```bash
   kubectl rollout history deployment/event-service -n eventos
   ```
2. **Execute Rollback**:
   To roll back to the immediate previous revision:
   ```bash
   kubectl rollout undo deployment/event-service -n eventos
   ```
   To roll back to a specific revision ID (e.g., revision 3):
   ```bash
   kubectl rollout undo deployment/event-service --to-revision=3 -n eventos
   ```
3. **Verify Rollout Status**:
   ```bash
   kubectl rollout status deployment/event-service -n eventos
   ```

### Scenario B: Rollback via Docker Compose
1. **Modify Version Variables in `.env`**:
   Open `/opt/EventOs/.env` and revert the image tag version variables:
   ```env
   # Change from v1.2.0 to previous stable v1.1.9
   CRM_IMAGE_TAG=v1.1.9
   EVENT_IMAGE_TAG=v1.1.9
   ```
2. **Trigger Container Recreation**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
3. **Confirm Container Version Integrity**:
   Verify that the target image tag matches:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Image}}"
   ```

---

## 3. Database Schema Reconciliations (Flyway)

If a schema migration fails or causes database locking issues:

1. **Stop Application Containers**:
   Prevent microservices from writing to Postgres while fixing schema states.
   ```bash
   docker-compose -f docker-compose.prod.yml scale crm-service=0 event-service=0
   ```
2. **Identify Failed Migration Row**:
   Connect to Postgres and view the `schema_version` history:
   ```sql
   SELECT * FROM flyway_schema_history WHERE success = false;
   ```
3. **Run Flyway Repair**:
   If a migration failed, clean up the failed metadata row to allow correction:
   - For maven locally: `mvn flyway:repair` (or execute the equivalent SQL cleaning the failed row from `flyway_schema_history`).
4. **Trigger Database Reconstruction (if corrupted)**:
   If databases are corrupted, follow the instructions in the Disaster Recovery runbook:
   ```bash
   ./docker/backup/restore.sh <target_timestamp>
   ```
