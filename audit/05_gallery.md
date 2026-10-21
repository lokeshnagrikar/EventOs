# EventOS Audit Report: Phase 5 – Gallery & Media Subsystem

**Audit Date:** 2026-10-20  
**Target:** EventOS Gallery Subsystem (`gallery-service` & `web/src/app/gallery`)  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Executive Summary

The Gallery & Media subsystem provides event photographers, agencies, and clients with high-resolution photo proofing, client favoriting, secure guest share links, dynamic watermarking, and batch ZIP archive downloads. The integration with Cloudinary avoids storing large multi-gigabyte media files directly on application servers.

However, three significant technical deficiencies were verified:
1. **Critical Memory Overhead in ZIP Streaming**: Media items are downloaded into heap memory as raw byte arrays before compression, risking JVM Out-Of-Memory crashes under moderate concurrency.
2. **Third-Party Data Leakage via QR Codes**: Private gallery tokens and full URLs are sent unencrypted to an external third-party service (`api.qrserver.com`).
3. **No Brute-Force Lockout on Passcodes**: Passcode protection uses BCrypt, but lacks request rate-limiting, allowing rapid PIN enumeration.

---

## 2. Upload Architecture & Validation

### Direct Client Signed Uploads
- **Endpoint:** `POST /items/signature` in `GalleryItemController.java:55-80`
- **Method:** The client requests signed parameters from `CloudinaryService.generateUploadSignature(...)`:
  ```java
  // CloudinaryService.java:270-305
  long timestamp = System.currentTimeMillis() / 1000L;
  String folder = "eventos/" + tenantId + "/" + eventIdStr + "/" + albumId;
  String publicId = folder + "/" + uniqueId;
  params.put("timestamp", timestamp);
  params.put("folder", folder);
  params.put("public_id", publicId);
  String signature = cloudinary.apiSignRequest(params, apiSecret);
  ```
- **Execution:** The frontend browser uploads media directly to Cloudinary's upload endpoint using the signed timestamp, folder, and signature. Application servers do not handle raw multi-gigabyte upload streams.
- **Upload Confirmation:** Once Cloudinary responds with `public_id` and `secure_url`, the frontend calls `POST /items/confirm` to persist metadata in PostgreSQL.

### File Validation
- **Size / Type Verification:**
  - File extension check on upload in `CloudinaryService.java:99-130`: validates extensions (`jpg`, `jpeg`, `png`, `webp`, `heic`, `mp4`, `mov`).
  - Size validation is partially enforced client-side, but missing explicit server-side byte limit rejection on `POST /items/confirm`.

---

## 3. ZIP Archive Streaming & Memory Analysis

### Implementation
- **Endpoints:**
  - Agency/Admin: `GET /albums/{albumId}/download` (`AlbumController.java:173-228`)
  - Public Guest: `GET /share/public/download/{token}` (`ShareLinkController.java:142-223`)
- **Code Flow:**
  ```java
  // AlbumController.java:206-212
  byte[] fileBytes = galleryItemService.downloadFileBytes(item.getUrl());
  if (fileBytes != null && fileBytes.length > 0) {
      java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(name);
      zipOut.putNextEntry(zipEntry);
      zipOut.write(fileBytes);
      zipOut.closeEntry();
  }
  ```
- **Memory Flaw:** `downloadFileBytes(item.getUrl())` calls `restTemplate.getForObject(fileUrl, byte[].class)`. For a 500-photo album (average 10MB per photo), this allocates large byte arrays on the JVM heap. In `docker-compose.prod.yml`, `gallery-service` has an assigned heap of 512MB (`-Xmx512m`). Two concurrent album downloads will exhaust available memory, triggering:
  ```text
  java.lang.OutOfMemoryError: Java heap space
  ```
- **Streaming Fix:** Use chunked streaming directly between the HTTP connection stream and the `ZipOutputStream`:
  ```java
  restTemplate.execute(item.getUrl(), HttpMethod.GET, null, clientResponse -> {
      StreamUtils.copy(clientResponse.getBody(), zipOut);
      return null;
  });
  ```

---

## 4. Watermarking & Video Previews

### Implementation Details
- **Location:** `CloudinaryService.java:232-268` & `ShareLinkService.java:133-146`
- **Dynamic Text Overlay:**
  ```java
  cloudinary.url()
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
- **Proofing vs Guest Download:**
  - When `watermark: true` is configured on a share link, `ShareLinkService.getSharedAlbum()` replaces the item's `url` with the Cloudinary watermarked transformation URL.
  - In `downloadSharedAlbum()`, the streaming engine downloads from the modified URL in the DTO, ensuring that downloaded ZIP files retain watermarks when enabled.
- **Video Watermarking:** Applied via `resourceType: "video"`. For large video files, on-the-fly video watermarking transformations can exceed Cloudinary's dynamic transformation execution timeout. Eager asynchronous transformations should be used for videos.

---

## 5. Security & Feature Integrity Audit

| Feature | Implementation Reality | Evidence | Risk Rating |
| :--- | :--- | :--- | :--- |
| **Guest Portal Token Entropy** | 128-bit random UUID (32 hex characters) | `ShareLinkService.java:57`: `UUID.randomUUID().toString().replace("-", "")` | ✅ Strong Entropy |
| **Passcode Protection** | BCrypt hashed, validated per session | `ShareLinkService.java:68,122`: `passwordEncoder.matches(...)` | ⚠️ Missing Rate Limit |
| **Brute Force Lockout** | Logging only, NO lockout | `ShareLinkService.java:190-203`: Logs to `share_link_access_logs` without IP throttling | 🚨 High Vulnerability |
| **QR Code Generation** | External 3rd party API call | `ShareQrModal.tsx:134`: calls `https://api.qrserver.com/v1/create-qr-code/` | ⚠️ Privacy Leakage |
| **Client Favoriting** | Column `favorite` in `gallery_items` | `GalleryItemRepository.java:22`, `GalleryItemController.java:187` | ✅ Implemented |
| **Frame Comments** | **NOT IMPLEMENTED** | No database table, entity, or API endpoint found for media comments | ❌ Missing Feature |

---

## 6. Files Reviewed in this Phase
1. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/AlbumController.java`
2. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/GalleryItemController.java`
3. `backend/gallery-service/src/main/java/com/eventos/gallery/controller/ShareLinkController.java`
4. `backend/gallery-service/src/main/java/com/eventos/gallery/service/AlbumService.java`
5. `backend/gallery-service/src/main/java/com/eventos/gallery/service/GalleryItemService.java`
6. `backend/gallery-service/src/main/java/com/eventos/gallery/service/ShareLinkService.java`
7. `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java`
8. `web/src/components/gallery/ShareQrModal.tsx`
9. `web/src/app/gallery/[id]/page.tsx`
10. `web/src/app/gallery/page.tsx`
