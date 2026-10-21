# EventOS Audit Report: Backend - Gallery Service (`gallery-service`)

**Audit Date:** 2026-10-20  
**Service:** `gallery-service`  
**Port:** `8084`  
**Database:** `eventos_gallery`  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Service Overview & Architecture

`gallery-service` handles all event media assets, high-resolution photography, video previews, client proofing galleries, watermarking, guest share portals, and batch ZIP archive streaming.

### Tech Stack
- **Framework:** Spring Boot 3.4.3 / Java 21
- **Persistence:** Spring Data JPA / Hibernate, PostgreSQL 17, Flyway (9 migrations: `V1` to `V9`)
- **Media Storage & CDN:** Cloudinary (Direct client signed uploads + transformation API)
- **Archive Engine:** Java Native `ZipOutputStream` with Spring `StreamingResponseBody`
- **Security:** Spring Security 6.4.3, JWT filter, BCrypt password protection for public links.

---

## 2. Endpoints & Authorization Matrix

| Method | Path | Required Role / Annotation | DTO Validation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/albums` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Lists albums for tenant and optional `eventId` |
| `GET` | `/albums/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Fetches album details by ID |
| `POST` | `/albums` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | `@Valid CreateAlbumDto` | Creates a new album |
| `PUT` | `/albums/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | `@Valid CreateAlbumDto` | Updates album metadata |
| `PUT` | `/albums/{id}/archive` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Archives album |
| `DELETE` | `/albums/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Deletes album and cascaded media |
| `GET` | `/albums/client` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Fetches albums for client's events |
| `GET` | `/albums/{albumId}/download`| `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Streams full album as a ZIP file |
| `POST` | `/share` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | `@Valid CreateShareLinkDto` | Generates a shareable token & passcode |
| `GET` | `/share/album/{albumId}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Lists share links for an album |
| `DELETE` | `/share/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Revokes a share link |
| `GET` | `/share/public/view/{token}` | `permitAll()` | None | Public guest viewer with optional passcode |
| `GET` | `/share/public/download/{token}` | `permitAll()` | None | Public ZIP download with optional passcode |
| `POST` | `/items/signature` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Generates signed Cloudinary upload params |
| `POST` | `/items/confirm` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | `@Valid ConfirmUploadDto` | Persists uploaded media metadata |
| `GET` | `/items` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Lists items by album with filters |
| `DELETE` | `/items/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Deletes item from Cloudinary and DB |
| `PATCH` | `/items/{id}/favorite` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Toggles favorite flag |

---

## 3. Deep Dive Findings

### Finding 1: Memory Exhaustion (OOM) via In-Memory Media Buffering During ZIP Streaming
- **Severity:** [HIGH]
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\controller\AlbumController.java:185-219` & `ShareLinkController.java:172-208`
- **Evidence:**
```java
// AlbumController.java:185-212
StreamingResponseBody stream = outputStream -> {
    try (java.util.zip.ZipOutputStream zipOut = new java.util.zip.ZipOutputStream(outputStream)) {
        for (GalleryItemResponseDto item : items) {
            ...
            try {
                byte[] fileBytes = galleryItemService.downloadFileBytes(item.getUrl());
                if (fileBytes != null && fileBytes.length > 0) {
                    java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(name);
                    zipOut.putNextEntry(zipEntry);
                    zipOut.write(fileBytes);
                    zipOut.closeEntry();
                }
            } catch (Exception e) { ... }
        }
        zipOut.finish();
    }
};
```
In `GalleryItemService.java`:
```java
public byte[] downloadFileBytes(String fileUrl) {
    return restTemplate.getForObject(fileUrl, byte[].class);
}
```
- **Impact:** `restTemplate.getForObject(fileUrl, byte[].class)` reads the entire media file (e.g., 25MB high-res raw photo or 200MB video) into Java JVM heap memory as a byte array before passing it to `zipOut`. If multiple users trigger album downloads simultaneously or an album contains hundreds of photos, the JVM heap will quickly throw `java.lang.OutOfMemoryError: Java heap space`, crashing the entire `gallery-service` container.
- **Fix:** Stream bytes directly from Cloudinary's HTTP input stream into `zipOut` in fixed chunks (e.g., 8KB buffers) using `InputStream.transferTo(OutputStream)` instead of reading full byte arrays into memory.

---

### Finding 2: Lack of Rate Limiting / Lockout on Public Passcode-Protected Gallery Links
- **Severity:** [HIGH]
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\service\ShareLinkService.java:118-125,162-166`
- **Evidence:**
```java
// ShareLinkService.java:118-125
if (shareLink.getPassword() != null && !shareLink.getPassword().isEmpty()) {
    if (passcode == null || passcode.trim().isEmpty()) {
        throw new BadCredentialsException("Passcode required");
    }
    if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
        throw new BadCredentialsException("Invalid passcode");
    }
}
...
catch (BadCredentialsException e) {
    String reason = "Passcode required".equalsIgnoreCase(e.getMessage()) ? "PASSCODE_REQUIRED" : "INVALID_PASSCODE";
    recordAccessLog(token, shareLink, false, reason, ipAddress, userAgent);
    throw e;
}
```
- **Impact:** Failed access attempts are recorded in `share_link_access_logs`, but there is **no lockout mechanism** or request throttling. A 4-digit numeric PIN has only 10,000 combinations. An automated attacker can execute 10,000 requests in a few minutes without being blocked, exposing private wedding and event photos.
- **Fix:** Implement Redis-based rate limiting on `(ipAddress, token)` (e.g. max 5 failed attempts per 15 minutes), after which the token is locked for that IP or triggers a CAPTCHA challenge.

---

### Finding 3: Token Entropy & Public Share Isolation
- **Severity:** [INFORMATIONAL / POSITIVE]
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\service\ShareLinkService.java:57`
- **Evidence:**
```java
String token = UUID.randomUUID().toString().replace("-", "");
```
- **Analysis:** Tokens are 128-bit cryptographically secure random UUIDs without dashes (32 hex characters). They are not sequential or guessable.
- **Data Isolation:** When viewing via public token, items are loaded using the tenant ID stored on the verified `ShareLink`:
  ```java
  List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(shareLink.getTenantId(), album.getId());
  ```
  This ensures cross-tenant data cannot be leaked through the public token viewer.

---

### Finding 4: Watermarking Implementation Details
- **Severity:** [LOW]
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\service\CloudinaryService.java:232-268`
- **Evidence:**
```java
String resourceType = isVideo ? "video" : "image";
...
return cloudinary.url()
        .resourceType(resourceType)
        .transformation(new com.cloudinary.Transformation()
                .overlay("text:Arial_60_bold:" + encodedText)
                .opacity(35)
                .angle(315)
                .gravity("center")
                .flags("layer_apply")
                .quality("auto")
                .fetchFormat("auto"))
        .generate(publicId);
```
- **Analysis:** Dynamic watermarks are applied using Cloudinary transformation URLs. For images, this is fast and cached at the CDN layer. For video files, applying on-the-fly text overlay transformations on Cloudinary can take substantial processing time or fail with HTTP 423 / timeout if not pre-generated using an eager transformation.

---

### Finding 5: Third-Party Privacy Leakage via External QR Code Generation
- **Severity:** [MEDIUM]
- **Location:** `d:\EventOs\web\src\components\gallery\ShareQrModal.tsx:134` & `d:\EventOs\web\src\app\gallery\[id]\page.tsx:382`
- **Evidence:**
```typescript
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}`;
```
- **Impact:** Gallery share links containing private access tokens are transmitted directly to a third-party commercial service (`api.qrserver.com`) without user consent or encryption. The third party's access logs will capture all private guest gallery URLs and tokens.
- **Fix:** Generate QR codes locally in the browser using the standard `qrcode.react` NPM package or on the backend using `com.google.zxing:core`, completely eliminating external API transmission.

---

## 4. Files Reviewed in this Phase
1. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/AlbumController.java`
2. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/GalleryItemController.java`
3. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/ShareLinkController.java`
4. `backend/gallery-service/src/main/java/com/eventos/gallery/service/AlbumService.java`
5. `backend/gallery-service/src/main/java/com/eventos/gallery/service/GalleryItemService.java`
6. `backend/gallery-service/src/main/java/com/eventos/gallery/service/ShareLinkService.java`
7. `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java`
8. `backend/gallery-service/src/main/java/com/eventos/gallery/entity/Album.java`
9. `backend/gallery-service/src/main/java/com/eventos/gallery/entity/GalleryItem.java`
10. `backend/gallery-service/src/main/java/com/eventos/gallery/entity/ShareLink.java`
11. `backend/gallery-service/src/main/java/com/eventos/gallery/repository/AlbumRepository.java`
12. `backend/gallery-service/src/main/java/com/eventos/gallery/repository/GalleryItemRepository.java`
13. `backend/gallery-service/src/main/java/com/eventos/gallery/repository/ShareLinkRepository.java`
