package com.eventos.auth.controller;

import com.eventos.auth.entity.Inquiry;
import com.eventos.auth.repository.InquiryRepository;
import com.eventos.auth.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/inquiries")
public class InquiryController {

    private static final Logger log = LoggerFactory.getLogger(InquiryController.class);

    private final InquiryRepository inquiryRepository;
    private final EmailService emailService;

    public InquiryController(InquiryRepository inquiryRepository, EmailService emailService) {
        this.inquiryRepository = inquiryRepository;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> createInquiry(@RequestBody Inquiry inquiry) {
        if (inquiry.getName() == null || inquiry.getName().trim().isEmpty() ||
            inquiry.getEmail() == null || inquiry.getEmail().trim().isEmpty() ||
            inquiry.getMessage() == null || inquiry.getMessage().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "All fields (name, email, message) are required.");
            return ResponseEntity.badRequest().body(error);
        }

        Inquiry saved = inquiryRepository.save(inquiry);
        log.info("[INQUIRY_RECEIVED] Saved new inquiry from '{}' <{}> (Sector/Team: {})", 
                saved.getName(), saved.getEmail(), saved.getTeamSize());

        try {
            emailService.sendInquiryNotificationToFounder(
                    saved.getName(), 
                    saved.getEmail(), 
                    saved.getTeamSize(), 
                    saved.getMessage()
            );
        } catch (Exception e) {
            log.warn("[INQUIRY_NOTIFICATION_FAILED] Failed to trigger email notification: {}", e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }
}
