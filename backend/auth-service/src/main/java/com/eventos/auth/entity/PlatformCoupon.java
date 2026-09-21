package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "discount_type", nullable = false)
    private String discountType; // PERCENTAGE, FIXED_AMOUNT

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @Column(name = "redemptions_count", nullable = false)
    private int redemptionsCount;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (discountType == null) discountType = "PERCENTAGE";
        if (discountValue == null) discountValue = BigDecimal.valueOf(10.00);
    }
}
