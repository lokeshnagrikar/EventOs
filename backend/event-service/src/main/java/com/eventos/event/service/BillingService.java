package com.eventos.event.service;

import com.eventos.event.entity.BillingProfile;
import com.eventos.event.entity.Invoice;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.BillingProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {

    private final BillingProfileRepository billingProfileRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    public BillingService(BillingProfileRepository billingProfileRepository,
                          BookingRepository bookingRepository,
                          InvoiceRepository invoiceRepository) {
        this.billingProfileRepository = billingProfileRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public BillingProfile getBillingProfile(UUID tenantId) {
        return billingProfileRepository.findById(tenantId)
                .orElseGet(() -> {
                    BillingProfile profile = BillingProfile.builder()
                            .tenantId(tenantId)
                            .planName("STARTER")
                            .billingCycle("MONTHLY")
                            .renewalDate(LocalDateTime.now().plusMonths(1))
                            .cardLast4("4242")
                            .cardBrand("Visa")
                            .cardExpiry("12/28")
                            .billingEmail("billing@agency.com")
                            .address("123 Main St, Metro City")
                            .build();
                    return billingProfileRepository.save(profile);
                });
    }

    @Transactional
    public BillingProfile updateBillingProfile(UUID tenantId, BillingProfile details) {
        BillingProfile profile = getBillingProfile(tenantId);
        
        if (details.getPlanName() != null) profile.setPlanName(details.getPlanName());
        if (details.getBillingCycle() != null) profile.setBillingCycle(details.getBillingCycle());
        if (details.getRenewalDate() != null) profile.setRenewalDate(details.getRenewalDate());
        if (details.getCardLast4() != null) profile.setCardLast4(details.getCardLast4());
        if (details.getCardBrand() != null) profile.setCardBrand(details.getCardBrand());
        if (details.getCardExpiry() != null) profile.setCardExpiry(details.getCardExpiry());
        if (details.getBillingEmail() != null) profile.setBillingEmail(details.getBillingEmail());
        if (details.getAddress() != null) profile.setAddress(details.getAddress());

        return billingProfileRepository.save(profile);
    }

    public Map<String, Object> getUsageStats(UUID tenantId) {
        long bookingsCount = bookingRepository.countByTenantId(tenantId);
        long invoicesCount = invoiceRepository.countByTenantId(tenantId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("bookingsCount", bookingsCount);
        stats.put("invoicesCount", invoicesCount);
        stats.put("storageUsedBytes", 1288490188L); // Mock 1.2 GB
        stats.put("storageLimitBytes", 5368709120L); // 5 GB
        stats.put("activeUsersCount", 3);
        stats.put("activeUsersLimit", 5);
        return stats;
    }
}
