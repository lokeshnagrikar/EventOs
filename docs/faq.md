# EventOS — Frequently Asked Questions (FAQ)

This guide addresses common questions, troubleshooting tips, and architectural details regarding the EventOS platform.

---

## 1. Setup & Local Execution

### Q: Why does my PowerShell command prompt hang when starting services?
**A**: Running Maven commands like `mvn spring-boot:run` in nested loops can freeze Windows PowerShell buffers. Always follow the **3-Step Launch Sequence**:
1. Run `mvn clean package -DskipTests` to package your `.jar` files.
2. Load env vars via `.\load_env.ps1`.
3. Launch jars directly: `java -jar <service>.jar` using memory limits (`-Xmx128m -XX:+UseSerialGC`) to keep local system resources light.

### Q: I get database password authentication errors on launch. What should I check?
**A**: Ensure that your local PostgreSQL instance is running on port `5433` (the default port configured in `.env.example`). If you are running PostgreSQL on the default port `5432`, update the `POSTGRES_PORT` value inside your local `.env` file.

---

## 2. Architecture & Data Segregation

### Q: How is multi-tenancy enforced in the database?
**A**: EventOS uses a single-schema, logical-partitioning model. Database tables contain a `tenant_id` column. The backend Spring Boot applications intercept client calls, extract the `X-Tenant-ID` header, and bind it to a `ThreadLocal` context (`TenantContext`). JPA/Hibernate interceptors intercept all database calls and append `AND tenant_id = :activeTenant` to guarantee isolation.

### Q: Can a user belong to multiple workspaces?
**A**: Yes. The user profile returns a list of `memberships` containing tenant IDs and associated roles. The client application can toggle the active workspace context, triggering the update of the `X-Tenant-ID` header for subsequent requests.

---

## 3. Operations & Reliability

### Q: What happens if RabbitMQ is offline?
**A**: The core REST API Gateway operates synchronously and can process logins, CRM pipelines, and calendar queries. However, inter-service side-effects (e.g., converting a price estimate to a CRM lead, or generating a booking from an accepted quote) are deferred and will throw exceptions. Ensure RabbitMQ is healthy by checking Actuator endpoints.

### Q: How do I add a new database migration table or schema changes?
**A**:
1. Navigate to the target service's resource folder: `src/main/resources/db/migration/`.
2. Add a new SQL file following the Flyway naming convention: `V{VERSION_NUMBER}__description.sql` (e.g., `V2__add_notifications_table.sql`).
3. Build and launch the service; Flyway runs the script on startup.
