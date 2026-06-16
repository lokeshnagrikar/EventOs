package com.eventos.crm.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    @PostConstruct
    public void init() {
        if ("demo".equalsIgnoreCase(cloudName) || "demo_key".equalsIgnoreCase(apiKey) || 
            "demo_secret".equalsIgnoreCase(apiSecret) || cloudName == null || cloudName.isEmpty()) {
            isMockMode = true;
            log.warn("Cloudinary credentials not configured or using 'demo' placeholders. Running in MOCK MODE. Uploaded PDFs will fallback to mock URLs.");
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

    /**
     * Upload raw PDF bytes to Cloudinary.
     * In mock mode, returns a reliable mock PDF URL.
     */
    public String uploadPdf(byte[] pdfBytes, String fileName) throws IOException {
        if (isMockMode) {
            log.info("Simulating PDF upload in Mock Mode for file: {}", fileName);
            // Return a standard, accessible PDF for mock previewing
            return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        try {
            log.info("Uploading PDF file {} to Cloudinary ({} bytes)...", fileName, pdfBytes.length);
            Map<?, ?> uploadResult = cloudinary.uploader().upload(pdfBytes, ObjectUtils.asMap(
                    "resource_type", "raw",
                    "folder", "eventos_quotes",
                    "public_id", fileName
            ));
            
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Successfully uploaded PDF to Cloudinary. URL: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Cloudinary upload failed for PDF {}: {}. Falling back to dummy URL.", fileName, e.getMessage());
            return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }
    }
}
