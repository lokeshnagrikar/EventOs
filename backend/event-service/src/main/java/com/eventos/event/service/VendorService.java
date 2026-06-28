package com.eventos.event.service;

import com.eventos.event.dto.CreateVendorDto;
import com.eventos.event.dto.CreateVendorContractDto;
import com.eventos.event.dto.CreateVendorAssignmentDto;
import com.eventos.event.dto.UpdateVendorContractDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@SuppressWarnings("null")
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorContractRepository vendorContractRepository;
    private final VendorAssignmentRepository vendorAssignmentRepository;
    private final BookingRepository bookingRepository;
    private final TimelineTaskRepository timelineTaskRepository;

    public VendorService(VendorRepository vendorRepository,
                         VendorContractRepository vendorContractRepository,
                         VendorAssignmentRepository vendorAssignmentRepository,
                         BookingRepository bookingRepository,
                         TimelineTaskRepository timelineTaskRepository) {
        this.vendorRepository = vendorRepository;
        this.vendorContractRepository = vendorContractRepository;
        this.vendorAssignmentRepository = vendorAssignmentRepository;
        this.bookingRepository = bookingRepository;
        this.timelineTaskRepository = timelineTaskRepository;
    }

    // ─── Vendor CRUD Operations ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Vendor> getAllVendors(UUID tenantId) {
        return vendorRepository.findAllByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Vendor getVendorById(UUID id, UUID tenantId) {
        return vendorRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found or access denied"));
    }

    private VendorCategory parseCategory(String serviceType) {
        if (serviceType == null || serviceType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service type is required");
        }
        try {
            return VendorCategory.valueOf(serviceType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid service type: " + serviceType);
        }
    }

    private void updatePaymentStatus(VendorContract contract) {
        BigDecimal paid = contract.getPaidAmount();
        if (paid == null) {
            paid = BigDecimal.ZERO;
            contract.setPaidAmount(paid);
        }
        BigDecimal actual = contract.getActualCost();
        if (actual == null) {
            actual = BigDecimal.ZERO;
            contract.setActualCost(actual);
        }

        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            contract.setPaymentStatus(VendorPaymentStatus.UNPAID);
        } else if (paid.compareTo(actual) >= 0) {
            contract.setPaymentStatus(VendorPaymentStatus.PAID);
        } else {
            contract.setPaymentStatus(VendorPaymentStatus.PARTIALLY_PAID);
        }
    }

    public Vendor createVendor(CreateVendorDto dto, UUID tenantId) {
        Vendor vendor = Vendor.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .serviceType(parseCategory(dto.getServiceType()))
                .status("ACTIVE")
                .build();
        vendor.setTenantId(tenantId);
        return vendorRepository.save(vendor);
    }

    public Vendor updateVendor(UUID id, CreateVendorDto dto, UUID tenantId) {
        Vendor vendor = getVendorById(id, tenantId);
        vendor.setName(dto.getName());
        vendor.setContactName(dto.getContactName());
        vendor.setEmail(dto.getEmail());
        vendor.setPhone(dto.getPhone());
        vendor.setServiceType(parseCategory(dto.getServiceType()));
        return vendorRepository.save(vendor);
    }

    public void deleteVendor(UUID id, UUID tenantId) {
        Vendor vendor = getVendorById(id, tenantId);
        vendorRepository.delete(vendor);
    }

    // ─── Vendor Contract Operations ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VendorContract> getAllContracts(UUID tenantId) {
        return vendorContractRepository.findAllByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public VendorContract getContractById(UUID id, UUID tenantId) {
        return vendorContractRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found or access denied"));
    }

    @Transactional(readOnly = true)
    public List<VendorContract> getContractsByBooking(UUID bookingId, UUID tenantId) {
        // Verify booking belongs to tenant
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));
        return vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);
    }

    public VendorContract createContract(CreateVendorContractDto dto, UUID tenantId) {
        // Enforce boundary checks
        vendorRepository.findByIdAndTenantId(dto.getVendorId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found or access denied"));
        bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        BigDecimal actual = dto.getActualCost() != null ? dto.getActualCost() : BigDecimal.ZERO;
        String status = dto.getStatus() != null ? dto.getStatus().toUpperCase() : "PENDING";
        BigDecimal paid = dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO;

        VendorContract contract = VendorContract.builder()
                .vendorId(dto.getVendorId())
                .bookingId(dto.getBookingId())
                .contractNumber(dto.getContractNumber())
                .details(dto.getDetails())
                .totalCost(dto.getTotalCost())
                .actualCost(actual)
                .paidAmount(paid)
                .contractUrl(dto.getContractUrl())
                .status(status)
                .build();
        contract.setTenantId(tenantId);
        updatePaymentStatus(contract);
        return vendorContractRepository.save(contract);
    }

    public VendorContract updateContract(UUID id, UpdateVendorContractDto dto, UUID tenantId) {
        VendorContract contract = getContractById(id, tenantId);

        if (dto.getDetails() != null) {
            contract.setDetails(dto.getDetails());
        }
        if (dto.getTotalCost() != null) {
            contract.setTotalCost(dto.getTotalCost());
        }
        if (dto.getActualCost() != null) {
            contract.setActualCost(dto.getActualCost());
        }
        if (dto.getPaidAmount() != null) {
            contract.setPaidAmount(dto.getPaidAmount());
        }
        if (dto.getContractUrl() != null) {
            contract.setContractUrl(dto.getContractUrl());
        }
        if (dto.getStatus() != null) {
            contract.setStatus(dto.getStatus().toUpperCase());
        }

        updatePaymentStatus(contract);
        return vendorContractRepository.save(contract);
    }

    public VendorContract recordContractPayment(UUID contractId, BigDecimal paymentAmount, UUID tenantId) {
        VendorContract contract = getContractById(contractId, tenantId);
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount must be greater than zero");
        }
        BigDecimal currentPaid = contract.getPaidAmount() != null ? contract.getPaidAmount() : BigDecimal.ZERO;
        contract.setPaidAmount(currentPaid.add(paymentAmount));
        updatePaymentStatus(contract);
        return vendorContractRepository.save(contract);
    }

    public void deleteContract(UUID id, UUID tenantId) {
        VendorContract contract = getContractById(id, tenantId);
        vendorContractRepository.delete(contract);
    }

    // ─── Vendor Assignment Operations ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VendorAssignment> getAllAssignments(UUID tenantId) {
        return vendorAssignmentRepository.findAllByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public VendorAssignment getAssignmentById(UUID id, UUID tenantId) {
        return vendorAssignmentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found or access denied"));
    }

    @Transactional(readOnly = true)
    public List<VendorAssignment> getAssignmentsByBooking(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));
        return vendorAssignmentRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);
    }

    public VendorAssignment assignVendor(CreateVendorAssignmentDto dto, UUID tenantId) {
        // Enforce boundary checks
        vendorRepository.findByIdAndTenantId(dto.getVendorId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found or access denied"));
        Booking booking = bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        if (dto.getTaskId() != null) {
            TimelineTask task = timelineTaskRepository.findById(dto.getTaskId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timeline task not found"));
            if (!task.getEventId().equals(booking.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Timeline task does not belong to the associated event");
            }
        }

        VendorAssignment assignment = VendorAssignment.builder()
                .vendorId(dto.getVendorId())
                .bookingId(dto.getBookingId())
                .taskId(dto.getTaskId())
                .roleDescription(dto.getRoleDescription())
                .build();
        assignment.setTenantId(tenantId);
        return vendorAssignmentRepository.save(assignment);
    }

    public void removeAssignment(UUID id, UUID tenantId) {
        VendorAssignment assignment = getAssignmentById(id, tenantId);
        vendorAssignmentRepository.delete(assignment);
    }
}
