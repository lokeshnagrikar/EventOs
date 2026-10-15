package com.eventos.crm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateQuoteDto {

    public CreateQuoteDto() {
    }

    public CreateQuoteDto(UUID leadId, String templateName, BigDecimal discount, BigDecimal taxRate, String clientNotes, String termsConditions, List<CreateQuoteItemDto> items) {
        this.leadId = leadId;
        this.templateName = templateName;
        this.discount = discount;
        this.taxRate = taxRate;
        this.clientNotes = clientNotes;
        this.termsConditions = termsConditions;
        this.items = items;
    }

    @NotNull(message = "Lead ID is required")
    private UUID leadId;

    private String templateName;

    @PositiveOrZero(message = "Discount must be positive or zero")
    private BigDecimal discount;

    @PositiveOrZero(message = "Tax rate must be positive or zero")
    private BigDecimal taxRate; // tax rate as percentage (e.g. 18.00)

    private String clientNotes;

    private String termsConditions;

    @NotEmpty(message = "Quote must have at least one line item")
    @Valid
    private List<CreateQuoteItemDto> items;
}
