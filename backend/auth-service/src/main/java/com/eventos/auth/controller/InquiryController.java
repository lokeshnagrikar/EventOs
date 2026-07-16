package com.eventos.auth.controller;

import com.eventos.auth.entity.Inquiry;
import com.eventos.auth.repository.InquiryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/inquiries")
public class InquiryController {

    private final InquiryRepository inquiryRepository;

    public InquiryController(InquiryRepository inquiryRepository) {
        this.inquiryRepository = inquiryRepository;
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
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }
}
