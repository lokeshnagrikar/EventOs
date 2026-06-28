package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateVendorDto;
import com.eventos.event.dto.CreateVendorContractDto;
import com.eventos.event.dto.CreateVendorAssignmentDto;
import com.eventos.event.dto.UpdateVendorContractDto;
import com.eventos.event.dto.RecordVendorPaymentDto;
import com.eventos.event.entity.Vendor;
import com.eventos.event.entity.VendorContract;
import com.eventos.event.entity.VendorAssignment;
import com.eventos.event.service.VendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Vendors", description = "Manage event vendors, vendor contracts, financial estimations, and task assignments")
@RestController
@RequestMapping("/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null) return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    // ─── Vendor Endpoints ─────────────────────────────────────────────────────

    @Operation(summary = "List vendors")
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getVendors() {
        UUID tenantId = getTenantId();
        List<Vendor> vendors = vendorService.getAllVendors(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", vendors);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get vendor by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getVendorById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Vendor vendor = vendorService.getVendorById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", vendor);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create vendor profile")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createVendor(@Valid @RequestBody CreateVendorDto dto) {
        UUID tenantId = getTenantId();
        Vendor vendor = vendorService.createVendor(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", vendor);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Update vendor profile")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateVendor(@PathVariable UUID id, @Valid @RequestBody CreateVendorDto dto) {
        UUID tenantId = getTenantId();
        Vendor vendor = vendorService.updateVendor(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", vendor);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete vendor profile")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> deleteVendor(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        vendorService.deleteVendor(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Vendor deleted successfully");

        return ResponseEntity.ok(response);
    }

    // ─── Vendor Contract Endpoints ───────────────────────────────────────────

    @Operation(summary = "List vendor contracts")
    @GetMapping("/contracts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getContracts() {
        UUID tenantId = getTenantId();
        List<VendorContract> contracts = vendorService.getAllContracts(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contracts);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get vendor contract by ID")
    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getContractById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        VendorContract contract = vendorService.getContractById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contract);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get contracts by booking")
    @GetMapping("/contracts/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getContractsByBooking(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        List<VendorContract> contracts = vendorService.getContractsByBooking(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contracts);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create vendor contract")
    @PostMapping("/contracts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createContract(@Valid @RequestBody CreateVendorContractDto dto) {
        UUID tenantId = getTenantId();
        VendorContract contract = vendorService.createContract(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contract);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Update vendor contract details")
    @PutMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateContract(@PathVariable UUID id, @Valid @RequestBody UpdateVendorContractDto dto) {
        UUID tenantId = getTenantId();
        VendorContract contract = vendorService.updateContract(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contract);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Record payment for a vendor contract")
    @PostMapping("/contracts/{id}/payments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> recordContractPayment(@PathVariable UUID id, @Valid @RequestBody RecordVendorPaymentDto dto) {
        UUID tenantId = getTenantId();
        VendorContract contract = vendorService.recordContractPayment(id, dto.getAmount(), tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contract);

        return ResponseEntity.ok(response);
    }


    @Operation(summary = "Delete vendor contract")
    @DeleteMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> deleteContract(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        vendorService.deleteContract(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contract deleted successfully");

        return ResponseEntity.ok(response);
    }

    // ─── Vendor Assignment Endpoints ─────────────────────────────────────────

    @Operation(summary = "List vendor assignments")
    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getAssignments() {
        UUID tenantId = getTenantId();
        List<VendorAssignment> assignments = vendorService.getAllAssignments(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignments);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get assignment by ID")
    @GetMapping("/assignments/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getAssignmentById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        VendorAssignment assignment = vendorService.getAssignmentById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignment);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get assignments by booking")
    @GetMapping("/assignments/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getAssignmentsByBooking(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        List<VendorAssignment> assignments = vendorService.getAssignmentsByBooking(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignments);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Assign vendor to booking/task")
    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> assignVendor(@Valid @RequestBody CreateVendorAssignmentDto dto) {
        UUID tenantId = getTenantId();
        VendorAssignment assignment = vendorService.assignVendor(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignment);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Remove vendor assignment")
    @DeleteMapping("/assignments/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> removeAssignment(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        vendorService.removeAssignment(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Vendor unassigned successfully");

        return ResponseEntity.ok(response);
    }
}
