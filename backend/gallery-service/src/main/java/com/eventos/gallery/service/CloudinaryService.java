package com.eventos.gallery.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@SuppressWarnings("null")
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean isMockMode = false;

    // High quality mock URLs to rotate through in mock mode
    private final List<String> mockImages = List.of(
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505232458627-a7272640778c?auto=format&fit=crop&w=1200&q=80"
    );

    private final List<String> mockVideos = List.of(
            "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
            "https://assets.mixkit.co/videos/preview/mixkit-camera-filming-a-couple-under-the-rain-42173-large.mp4"
    );

    private final Random random = new Random();

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
            "video/mp4", "video/quicktime", "video/x-matroska", "video/webm"
    );

    @PostConstruct
    public void init() {
        if ("demo".equalsIgnoreCase(cloudName) || "demo_key".equalsIgnoreCase(apiKey) || 
            "demo_secret".equalsIgnoreCase(apiSecret) || cloudName == null || cloudName.isEmpty()) {
            isMockMode = true;
            log.warn("Cloudinary credentials not configured or using 'demo' placeholders. Running in MOCK MODE. Uploaded media will fallback to premium stock URLs.");
        } else {
            try {
                cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true,
                        "timeout", 60 // 60 seconds request timeout
                ));
                log.info("Cloudinary client initialized successfully for cloud: {}", cloudName);
            } catch (Exception e) {
                log.error("Failed to initialize Cloudinary client. Falling back to MOCK MODE. Error: {}", e.getMessage());
                isMockMode = true;
            }
        }
    }

    public Map<String, Object> upload(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported media type: " + contentType + ". Only standard images and videos are allowed.");
        }
        
        boolean isVideo = contentType.startsWith("video/");
        
        if (isMockMode) {
            log.info("Simulating media upload in Mock Mode for file: {}", file.getOriginalFilename());
            Map<String, Object> result = new HashMap<>();
            String url = isVideo 
                    ? mockVideos.get(random.nextInt(mockVideos.size()))
                    : mockImages.get(random.nextInt(mockImages.size()));
            
            result.put("secure_url", url);
            result.put("public_id", "mock_" + UUID.randomUUID().toString().replace("-", ""));
            result.put("bytes", file.getSize());
            result.put("format", isVideo ? "mp4" : "jpg");
            result.put("width", 1920);
            result.put("height", 1080);
            result.put("resource_type", isVideo ? "video" : "image");
            if (isVideo) {
                result.put("duration", 15.0 + random.nextDouble() * 20.0);
            }
            return result;
        }

        log.info("Uploading file stream {} to Cloudinary...", file.getOriginalFilename());
        Map uploadResult = cloudinary.uploader().upload(file.getInputStream(), ObjectUtils.asMap(
                "resource_type", "auto",
                "folder", "eventos_gallery"
        ));
        
        Map<String, Object> result = new HashMap<>();
        result.put("secure_url", uploadResult.get("secure_url"));
        result.put("public_id", uploadResult.get("public_id"));
        
        Object bytesObj = uploadResult.get("bytes");
        if (bytesObj instanceof Number) {
            result.put("bytes", ((Number) bytesObj).longValue());
        } else {
            result.put("bytes", file.getSize());
        }
        
        result.put("format", uploadResult.get("format"));
        
        Object durationObj = uploadResult.get("duration");
        if (durationObj instanceof Number) {
            result.put("duration", ((Number) durationObj).doubleValue());
        }
        
        Object widthObj = uploadResult.get("width");
        if (widthObj instanceof Number) {
            result.put("width", ((Number) widthObj).intValue());
        }
        
        Object heightObj = uploadResult.get("height");
        if (heightObj instanceof Number) {
            result.put("height", ((Number) heightObj).intValue());
        }
        
        Object resourceTypeObj = uploadResult.get("resource_type");
        if (resourceTypeObj != null) {
            result.put("resource_type", resourceTypeObj.toString());
        }
        
        return result;
    }

    public void delete(String publicId, boolean isVideo) throws IOException {
        if (isMockMode || publicId == null || publicId.startsWith("mock_")) {
            log.info("Simulating media deletion in Mock Mode for public ID: {}", publicId);
            return;
        }

        log.info("Deleting public ID {} from Cloudinary...", publicId);
        String resourceType = isVideo ? "video" : "image";
        Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
        if (result == null) {
            throw new IOException("Cloudinary deletion failed with null response");
        }
        String status = (String) result.get("result");
        if (!"ok".equals(status) && !"not found".equals(status)) {
            throw new IOException("Cloudinary deletion failed with response: " + result);
        }
        log.info("Successfully deleted public ID {} from Cloudinary (status: {})", publicId, status);
    }

    public String getOptimizedUrl(String publicId, boolean isVideo) {
        if (isMockMode || publicId == null || publicId.startsWith("mock_")) {
            return null;
        }
        String resourceType = isVideo ? "video" : "image";
        return cloudinary.url()
                .resourceType(resourceType)
                .transformation(new com.cloudinary.Transformation()
                        .quality("auto")
                        .fetchFormat("auto"))
                .generate(publicId);
    }

    public Map<String, Object> generateUploadSignature(UUID tenantId, UUID albumId, UUID eventId, String filename) {
        long timestamp = System.currentTimeMillis() / 1000L;
        // Generate a clean public_id (avoid invalid characters in folder/filenames)
        String uniqueId = UUID.randomUUID().toString().replace("-", "");
        String eventIdStr = eventId != null ? eventId.toString() : "no_event";
        String folder = "eventos/" + tenantId + "/" + eventIdStr + "/" + albumId;
        String publicId = folder + "/" + uniqueId;

        Map<String, Object> params = new HashMap<>();
        params.put("timestamp", timestamp);
        params.put("folder", folder);
        params.put("public_id", publicId);

        String signature;
        if (isMockMode) {
            signature = "mock_sig_" + UUID.randomUUID().toString().replace("-", "");
        } else {
            try {
                signature = cloudinary.apiSignRequest(params, apiSecret);
            } catch (Exception e) {
                log.error("Failed to generate Cloudinary upload signature: {}", e.getMessage());
                throw new IllegalStateException("Failed to generate Cloudinary signature: " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("signature", signature);
        result.put("timestamp", timestamp);
        result.put("publicId", publicId);
        result.put("folder", folder);
        result.put("apiKey", apiKey);
        result.put("cloudName", cloudName);
        result.put("uploadUrl", "https://api.cloudinary.com/v1_1/" + (cloudName != null ? cloudName : "demo") + "/auto/upload");
        return result;
    }

    public boolean isMockMode() {
        return this.isMockMode;
    }
}
