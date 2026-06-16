package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budget_estimates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetEstimate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "decor_style", nullable = false)
    private String decorStyle;

    @Column(name = "venue_type")
    private String venueType;

    @Column(name = "effects_list")
    private String effectsList;

    @Column(name = "catering_total", nullable = false)
    private BigDecimal cateringTotal;

    @Column(name = "decor_total", nullable = false)
    private BigDecimal decorTotal;

    @Column(name = "venue_total")
    private BigDecimal venueTotal;

    @Column(name = "effects_total", nullable = false)
    private BigDecimal effectsTotal;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_phone")
    private String clientPhone;



    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
