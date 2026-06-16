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
                        "secure", true
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
        boolean isVideo = contentType != null && contentType.startsWith("video/");
        
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
            if (isVideo) {
                result.put("duration", 15.0 + random.nextDouble() * 20.0);
            }
            return result;
        }

        log.info("Uploading file {} to Cloudinary...", file.getOriginalFilename());
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
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
        
        return result;
    }

    public void delete(String publicId, boolean isVideo) {
        if (isMockMode || publicId == null || publicId.startsWith("mock_")) {
            log.info("Simulating media deletion in Mock Mode for public ID: {}", publicId);
            return;
        }

        try {
            log.info("Deleting public ID {} from Cloudinary...", publicId);
            String resourceType = isVideo ? "video" : "image";
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
        } catch (Exception e) {
            log.error("Failed to delete media from Cloudinary for public ID {}: {}", publicId, e.getMessage());
        }
    }
}
