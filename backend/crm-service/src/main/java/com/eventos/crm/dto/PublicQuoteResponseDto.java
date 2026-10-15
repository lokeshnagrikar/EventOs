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
public class PublicQuoteResponseDto {

    public PublicQuoteResponseDto() {
    }

    public PublicQuoteResponseDto(UUID id, String quoteNumber, String shareToken, String status, String templateName,
                                  BigDecimal subtotal, BigDecimal discount, BigDecimal tax, BigDecimal total,
                                  String clientName, String clientEmail, String clientPhone, String eventName,
                                  String eventDate, String venueName, String clientNotes, String termsConditions,
                                  LocalDateTime createdAt, List<PublicQuoteItemDto> items) {
        this.id = id;
        this.quoteNumber = quoteNumber;
        this.shareToken = shareToken;
        this.status = status;
        this.templateName = templateName;
        this.subtotal = subtotal;
        this.discount = discount;
        this.tax = tax;
        this.total = total;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.clientPhone = clientPhone;
        this.eventName = eventName;
        this.eventDate = eventDate;
        this.venueName = venueName;
        this.clientNotes = clientNotes;
        this.termsConditions = termsConditions;
        this.createdAt = createdAt;
        this.items = items;
    }

    private UUID id;
    private String quoteNumber;
    private String shareToken;
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
    public static class PublicQuoteItemDto {

        public PublicQuoteItemDto() {
        }

        public PublicQuoteItemDto(UUID id, String itemName, String description, BigDecimal unitPrice, Integer quantity, BigDecimal total) {
            this.id = id;
            this.itemName = itemName;
            this.description = description;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
            this.total = total;
        }

        private UUID id;
        private String itemName;
        private String description;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal total;
    }
}
