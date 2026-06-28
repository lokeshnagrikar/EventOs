# EventOS Disaster Recovery Runbook

This runbook outlines the disaster recovery procedures for the EventOS multi-tenant platform databases and microservices.

---

## 1. Objectives & Metrics

- **Recovery Point Objective (RPO)**: **1 Hour**  
  Data loss must not exceed 1 hour. This is achieved via hourly scheduled automated cron backup jobs uploading archives to secure, redundant offsite object storage (AWS S3).
- **Recovery Time Objective (RTO)**: **15 Minutes**  
  Total system restoration time from complete site failure to active state must be under 15 minutes.

---

## 2. Backup Strategy

Automated hourly backups are executed via `backup.sh`. The backup cycle performs:
1. Active PostgreSQL schema and data dump for all services (`auth_db`, `crm_db`, `event_db`, `gallery_db`).
2. Gzip compression of the generated SQL dumps.
3. SHA256 checksum generation for backup integrity verification.
4. Offsite replication to AWS S3 bucket `s3://${S3_BUCKET}/backups/`.
5. Local pruning of backup files older than 7 days.

---

## 3. Step-by-Step Restoration Procedure

### Scenario A: Local Database Corruption or Rollback

Use this scenario if the database is running but data is corrupted, or a faulty deployment requires rolling back database state to a known timestamp.

1. **Identify the Target Backup Timestamp**  
   Check the backup files in the backup directory or S3 bucket to find the target recovery timestamp (format: `YYYYMMDD_HHMMSS`).
   ```bash
   ls -la docker/backup/backups/
   ```

2. **Stop Microservices Traffic**  
   Scale down microservice containers to prevent active transaction writes during the restore process.
   ```bash
   docker-compose -f docker-compose.prod.yml scale api-gateway=0 auth-service=0 crm-service=0 event-service=0 gallery-service=0
   ```

3. **Execute Restore Script**  
   Run the restore script passing the backup timestamp suffix:
   ```bash
   ./docker/backup/restore.sh 20260616_234755
   ```
   The script automatically:
   - Verifies the backup checksum matches.
   - Terminates open connection pools to database schemas.
   - Drops and recreates `auth_db`, `crm_db`, `event_db`, and `gallery_db`.
   - Imports the SQL schema and data.

4. **Verify database status**  
   Connect to Postgres and verify that tables are populated:
   ```bash
   docker exec -it eventos-postgres-prod psql -U eventos_admin -d crm_db -c "\dt"
   ```

5. **Start Microservices & Trigger Flyway Repair**  
   Scale the microservice containers back up. When starting, the applications will validate schemas using Flyway.
   ```bash
   docker-compose -f docker-compose.prod.yml scale auth-service=1 crm-service=1 event-service=1 gallery-service=1 api-gateway=1
   ```

---

### Scenario B: Complete Infrastructure Node Failure (Bare-metal / VM Rebuild)

Use this scenario if the host machine hosting the docker containers experiences hardware or OS failure.

1. **Provision New Host Machine**  
   Ensure Docker and Docker Compose v2 are installed on the new host machine.

2. **Clone Code Repository**  
   Clone the EventOS platform code base:
   ```bash
   git clone https://github.com/lokeshnagrikar/EventOs.git /opt/EventOs
   cd /opt/EventOs
   ```

3. **Download Backups from Offsite Storage (S3)**  
   Download the target backup files from S3 to `/opt/EventOs/backups/`:
   ```bash
   mkdir -p backups
   aws s3 cp s3://your-eventos-backups/backups/ backups/ --recursive --exclude "*" --include "*_20260616_234755.sql.gz*"
   ```

4. **Spin up Core Infrastructure**  
   Start postgres, redis, and rabbitmq containers first, waiting for them to reach `healthy` state:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d postgres redis rabbitmq
   ```

5. **Run the Restore Script**  
   Run the restoration script using the downloaded S3 archive timestamp:
   ```bash
   export BACKUP_DIR="/opt/EventOs/backups"
   ./docker/backup/restore.sh 20260616_234755
   ```

6. **Spin up Microservices and Web Frontend**  
   Start the remaining services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Verify Platform Health**  
   Query the gateway actuator health endpoint to confirm all services are up and connected:
   ```bash
   curl -f http://localhost:8080/actuator/health
   ```

---

## 4. Recovery Verification Checklist

- [ ] Check `/opt/EventOs/backups/restore_ledger.log` for any database import errors.
- [ ] Verify HTTP response code of `http://localhost:8080/actuator/health` is `200 OK` and status is `"UP"`.
- [ ] Connect to Grafana at `http://localhost:3001` and check the system dashboard to verify active connection pools.
- [ ] Log in via the Client Portal or CRM dashboard to verify user authentication works and data is consistent.
