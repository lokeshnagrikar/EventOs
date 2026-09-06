package com.eventos.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicQuoteResponseDto {
    private UUID id;
    private String quoteNumber;
    private String status;
    private String templateName;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal total;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String eventName;
    private String eventDate;
    private String venueName;
    private String clientNotes;
    private String termsConditions;
    private LocalDateTime createdAt;
    private List<PublicQuoteItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicQuoteItemDto {
        private UUID id;
        private String itemName;
        private String description;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal total;
    }
}
