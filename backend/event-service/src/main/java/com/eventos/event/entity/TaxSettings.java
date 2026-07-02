package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tax_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxSettings {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "gst_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "invoice_format", nullable = false)
    private String invoiceFormat;

    @Column(name = "payment_terms_days", nullable = false)
    private int paymentTermsDays;

    @Column(name = "late_fee_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal lateFeePercentage;

    @Column(name = "automatic_calculation", nullable = false)
    private boolean automaticCalculation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (gstRate == null) gstRate = new BigDecimal("18.00");
        if (vatRate == null) vatRate = BigDecimal.ZERO;
        if (invoiceFormat == null) invoiceFormat = "INV-{{year}}-{{seq}}";
        if (paymentTermsDays == 0) paymentTermsDays = 15;
        if (lateFeePercentage == null) lateFeePercentage = new BigDecimal("2.00");
        automaticCalculation = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
