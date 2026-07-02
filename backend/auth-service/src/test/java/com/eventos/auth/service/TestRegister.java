package com.eventos.auth.service;

import com.eventos.auth.dto.RegisterRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.util.Map;
import java.util.UUID;

@SpringBootTest
@ActiveProfiles("prod")
public class TestRegister {

    @Autowired
    private AuthService authService;

    @Test
    public void testRegistration() {
        System.out.println("Starting registration test...");
        
        RegisterRequestDto request = new RegisterRequestDto();
        request.setFirstName("Lokesh");
        request.setLastName("Nagrikar");
        request.setEmail("nagrikarlokeshtest" + UUID.randomUUID().toString().substring(0, 8) + "@gmail.com");
        request.setPhone("8698495674");
        request.setPassword("Password123!");
        request.setCompanyName("Nagrikar Corp");

        try {
            Map<String, Object> result = authService.register(request);
            System.out.println("✅ Registration succeeded: " + result);
        } catch (Exception e) {
            System.out.println("❌ Registration failed with exception:");
            e.printStackTrace();
        }
    }
}
