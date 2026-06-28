package com.eventos.crm.controller;

import com.eventos.crm.dto.CreateContactDto;
import com.eventos.crm.entity.Contact;
import com.eventos.crm.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "CRM — Contacts", description = "Manage client contact profiles: create, update, search, and delete")
@RestController
@RequestMapping("/contacts")
public class CrmContactController {

    private final ContactService contactService;

    public CrmContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @Operation(summary = "List contacts", description = "Returns paginated contact records for the active tenant workspace. Filter by search query on name/email.")
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getContacts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String sort) {
        
        UUID tenantId = getTenantId();
        
        Sort sortOrder = Sort.unsorted();
        if (sort != null && !sort.isEmpty()) {
            String[] parts = sort.split(",");
            String property = parts[0];
            Sort.Direction direction = Sort.Direction.ASC;
            if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.DESC;
            }
            sortOrder = Sort.by(direction, property);
        } else {
            sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        }
        
        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Contact> contactsPage = contactService.getContacts(tenantId, query, pageable);
                
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contactsPage.getContent());
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", contactsPage.getNumber());
        pagination.put("size", contactsPage.getSize());
        pagination.put("totalElements", contactsPage.getTotalElements());
        pagination.put("totalPages", contactsPage.getTotalPages());
        response.put("pagination", pagination);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get contact by ID", description = "Returns full details of a single contact profile.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getContactById(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            Contact contact = contactService.getContactById(id, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", contact);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @Operation(summary = "Create contact", description = "Manually registers a new client contact profile.")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> createContact(@Valid @RequestBody CreateContactDto dto) {
        try {
            UUID tenantId = getTenantId();
            Contact contact = contactService.createContact(dto, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", contact);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    @Operation(summary = "Update contact details", description = "Modifies fields on an existing client contact profile.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateContact(
            @PathVariable UUID id,
            @Valid @RequestBody CreateContactDto dto) {
        try {
            UUID tenantId = getTenantId();
            Contact contact = contactService.updateContact(id, dto, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", contact);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @Operation(summary = "Delete contact", description = "Soft-deletes the contact profile. Active leads referencing it will remain unaffected but the profile is omitted from contact listings.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deleteContact(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            contactService.deleteContact(id, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact successfully deleted");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.UNAUTHORIZED, "Tenant context is missing or invalid");
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);

        return errorResponse;
    }
}
