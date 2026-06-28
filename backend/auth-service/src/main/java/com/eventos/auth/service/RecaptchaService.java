package com.eventos.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class RecaptchaService {

    @Value("${app.recaptcha.enabled:false}")
    private boolean enabled;

    @Value("${app.recaptcha.secret-key:}")
    private String secretKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    public boolean isEnabled() {
        return enabled;
    }

    @SuppressWarnings("unchecked")
    public boolean verifyToken(String token, String ipAddress) {
        if (!enabled) {
            // Fallback development mode validation
            return "MOCKCAPTCHA".equalsIgnoreCase(token);
        }

        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        try {
            String url = VERIFY_URL + "?secret=" + secretKey + "&response=" + token;
            if (ipAddress != null && !ipAddress.isEmpty()) {
                url += "&remoteip=" + ipAddress;
            }

            Map<String, Object> response = restTemplate.postForObject(url, null, Map.class);
            if (response != null) {
                return Boolean.TRUE.equals(response.get("success"));
            }
        } catch (Exception e) {
            // Return false to prevent bypass during failure
            return false;
        }
        return false;
    }
}
