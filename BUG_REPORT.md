# EventOs System Audit Bug Report

This document reports critical and minor issues identified during the system-wide security, communication, configuration, and CRUD audit of the EventOs application.

---

## 1. Double Context Prefixing in Service-to-Service REST Communication
* **Component:** `event-service` (`BookingService.java` & `PaymentService.java`)
* **Severity:** **Critical**
* **Status:** Open (Needs Code Fix)
* **Consequences:** Key business logic operations (such as converting quotes to bookings, verifying lead contacts for permissions, and invalidating dashboard caches) fail with **404 Not Found** errors.

### Root Cause
In `event-service`'s [application.yml](file:///d:/EventOs/backend/event-service/src/main/resources/application.yml#L46), the CRM service base URL is configured as:
```yaml
service:
  crm:
    base-url: ${CRM_SERVICE_URL:http://localhost:8082/api/v1/crm}
```
This means `crmServiceBaseUrl` in the Java classes resolves to `http://localhost:8082/api/v1/crm`.
However, inside [BookingService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/BookingService.java) and [PaymentService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/PaymentService.java), the REST requests append hardcoded paths containing `"/crm"`:
* **BookingService.java L158:** `crmServiceBaseUrl + "/crm/quotes/" + booking.getQuoteId().toString()`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/quotes/{id}`
* **BookingService.java L169:** `crmServiceBaseUrl + "/crm/leads/" + leadId.toString()`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/leads/{id}`
* **BookingService.java L360:** `crmServiceBaseUrl + "/crm/quotes/" + quoteId.toString()`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/quotes/{id}`
* **BookingService.java L399:** `crmServiceBaseUrl + "/crm/leads/" + leadId.toString()`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/leads/{id}`
* **BookingService.java L760:** `crmServiceBaseUrl + "/crm/dashboard/metrics/cache"`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/dashboard/metrics/cache`
* **PaymentService.java L205:** `crmServiceBaseUrl + "/crm/dashboard/metrics/cache"`
  * Resolves to: `http://localhost:8082/api/v1/crm/crm/dashboard/metrics/cache`

### How to Fix
Modify the path strings in `BookingService.java` and `PaymentService.java` to remove the redundant `"/crm"` segment. 
For example, change `crmServiceBaseUrl + "/crm/quotes/"` to `crmServiceBaseUrl + "/quotes/"`.

---

## 2. Missing Context Path Prefix in CRM to Event Service Communication
* **Component:** `crm-service` (`DashboardService.java`)
* **Severity:** **Critical**
* **Status:** Open (Needs Configuration and Code Fix)
* **Consequences:** The CRM Dashboard metrics aggregation endpoint fails to fetch event and financial statistics (like upcoming events list, revenue metrics, and outstanding payments balance), resulting in **404 Not Found** errors and causing the CRM Dashboard to display default fallback values (0 events, 0 revenue).

### Root Cause
1. In `crm-service`'s [DashboardService.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/service/DashboardService.java#L30-L31), the `eventServiceBaseUrl` falls back to `http://localhost:8083/api/v1` because the property `service.event.base-url` is missing from `crm-service`'s `application.yml`.
2. The `event-service` is configured with context-path `server.servlet.context-path: /api/v1/events`.
3. In `DashboardService.java` L242, the endpoint is called as:
   ```java
   eventServiceBaseUrl + "/dashboard/metrics"
   ```
   This resolves to `http://localhost:8083/api/v1/dashboard/metrics`, but the actual endpoint lies at `http://localhost:8083/api/v1/events/dashboard/metrics`.

### How to Fix
1. Add the missing event service property in `crm-service`'s [application.yml](file:///d:/EventOs/backend/crm-service/src/main/resources/application.yml):
   ```yaml
   service:
     event:
       base-url: ${EVENT_SERVICE_URL:http://localhost:8083/api/v1/events}
   ```
2. Modify the `@Value` definition in `DashboardService.java` to reflect the corrected fallback:
   ```java
   @org.springframework.beans.factory.annotation.Value("${service.event.base-url:http://localhost:8083/api/v1/events}")
   private String eventServiceBaseUrl;
   ```

---

## 3. TenantContext ThreadLocal Leak on Gateway Header Ingress Path
* **Component:** `auth-service`, `crm-service`, `event-service` (`JwtRequestFilter.java`)
* **Severity:** **High** (Security Isolation Risk)
* **Status:** Open (Needs Code Fix)
* **Consequences:** Requests routed through the API Gateway authenticate by receiving headers like `X-Tenant-ID`. The filter sets `TenantContext.setTenantId(tenantId)` to enable database multi-tenancy filtering. However, because it calls `filterChain.doFilter(request, response)` and returns early, the ThreadLocal tenant context is **never cleared** for Gateway-authenticated requests. This leaks tenant context to subsequent requests processed by the same Tomcat container thread.

### Root Cause
In all three microservice `JwtRequestFilter` classes:
* [auth-service JwtRequestFilter.java L51-85](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/config/JwtRequestFilter.java#L51-L85)
* [crm-service JwtRequestFilter.java L61-95](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/config/JwtRequestFilter.java#L61-L95)
* [event-service JwtRequestFilter.java L61-95](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/gateway/config/JwtAuthFilter.java#L61-L95) *(Note: check correct service path)*

The code sets the tenant:
```java
TenantContext.setTenantId(tenantId);
```
But immediately executes the filter chain and returns:
```java
filterChain.doFilter(request, response);
return;
```
It skips the `finally` block containing `TenantContext.clear()` which is situated at the very bottom of the method.

### How to Fix
Wrap the Gateway header branch filter execution inside a `try-finally` block:
```java
try {
    TenantContext.setTenantId(tenantId);
    filterChain.doFilter(request, response);
} finally {
    TenantContext.clear();
}
return;
```

---

## 4. Incomplete Team Management Permissions Restriction
* **Component:** `auth-service` (`SettingsController.java`)
* **Severity:** **Medium**
* **Status:** Open (Needs Code Fix)
* **Consequences:** Users with `MANAGER` or `STAFF` roles cannot access the team member list `/settings/team`. In collaborative views (like scheduling booking resource assignments or selecting event coordinators), the frontend fails to fetch user lists, resulting in **403 Forbidden** errors.

### Root Cause
In `auth-service`'s [SettingsController.java L117](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/controller/SettingsController.java#L117):
```java
@GetMapping("/team")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
```
It strictly limits fetching the team list to `OWNER` and `ADMIN` roles, blocking other workspace roles who need to load the list for assignments.

### How to Fix
Change the `@PreAuthorize` annotation to allow read-only access for `MANAGER` and `STAFF`:
```java
@GetMapping("/team")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
```

---

## 5. Stale Dashboard Cache on Event-Driven Booking Provisioning
* **Component:** `event-service` (`BookingService.java`)
* **Severity:** **Low**
* **Status:** Open (Needs Code Fix)
* **Consequences:** When a booking is auto-created in response to a RabbitMQ `QuoteAcceptedEvent` message, the dashboard cache invalidation fails with a warning: `Skipping dashboard cache invalidation: no auth header in request context`. The dashboard metrics on the CRM service remain stale for up to 10 minutes (cache TTL) since the background worker thread lacks an active HTTP servlet session.

### Root Cause
In `BookingService.java` L745, `invalidateDashboardCache` expects a request attribute to fetch the `Authorization` header to make a WebClient call:
```java
ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
```
During RabbitMQ processing, `attr` is null, so it skips invalidating the CRM cache.

### How to Fix
Introduce a RabbitMQ message or a shared Redis eviction command to clear the cache directly, avoiding the need to invoke the external CRM REST controller authenticated via the client's token.

---

## 6. Missing Frontend Environment File configuration
* **Component:** `web` frontend
* **Severity:** **Low** (Configuration documentation)
* **Status:** Open (Needs User setup)
* **Consequences:** If the user starts the web frontend directly, the app might try to resolve the default environment fallback. Creating a `.env` file containing the correct backend API URL and reCAPTCHA site keys is required for proper connection.

### How to Fix
Copy the `.env.example` in `d:\EventOs\web` to `.env` and configure:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LfVWistAAAAAK806E9mY3QsN5pyWIEcPkavpk_b
```
