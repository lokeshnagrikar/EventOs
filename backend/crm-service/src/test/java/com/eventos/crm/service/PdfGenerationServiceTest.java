package com.eventos.crm.service;

import com.eventos.crm.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class PdfGenerationServiceTest {

    private PdfGenerationService pdfGenerationService;
    private Lead mockLead;
    private Quote mockQuote;

    @BeforeEach
    void setUp() {
        pdfGenerationService = new PdfGenerationService();

        Contact contact = Contact.builder()
                .id(UUID.randomUUID())
                .firstName("Verma")
                .lastName("Reception")
                .email("verma@gmail.com")
                .phone("+91 9876543210")
                .build();
        contact.setTenantId(UUID.randomUUID());

        mockLead = Lead.builder()
                .id(UUID.randomUUID())
                .name("Verma Reception")
                .contact(contact)
                .build();
        mockLead.setTenantId(contact.getTenantId());
    }

    @Test
    void testPdfGenerationWithExtremeFractionalDecimalsDoesNotCrash() {
        // Construct quote items with fractional and long decimal values
        List<QuoteItem> items = new ArrayList<>();
        items.add(QuoteItem.builder()
                .id(UUID.randomUUID())
                .itemName("Premium Lighting Setup")
                .description("Intelligent DMX wash lights and spots")
                .unitPrice(new BigDecimal("150.123456")) // Fractional price
                .quantity(3)
                .total(new BigDecimal("450.370368")) // Fractional item total
                .build());
        
        items.add(QuoteItem.builder()
                .id(UUID.randomUUID())
                .itemName("Stage Backdrops Design")
                .description("Standard backdrop frame flex layout")
                .unitPrice(new BigDecimal("0.333333")) // Sub-cent fractional price
                .quantity(100)
                .total(new BigDecimal("33.333300")) // Fractional total
                .build());

        // Construct quote containing fractional financial fields
        mockQuote = Quote.builder()
                .id(UUID.randomUUID())
                .leadId(mockLead.getId())
                .quoteNumber("QT-9999-v1")
                .status(QuoteStatus.DRAFT)
                .templateName("MINIMALIST")
                .subtotal(new BigDecimal("483.703668")) // Fractional subtotal
                .discount(new BigDecimal("10.5555")) // Fractional discount
                .tax(new BigDecimal("85.16666")) // Fractional tax amount
                .total(new BigDecimal("558.314828")) // Fractional grand total
                .clientNotes("Standard test proposal notes.")
                .termsConditions("Standard test proposal terms.")
                .createdAt(LocalDateTime.now())
                .items(items)
                .build();
        mockQuote.setTenantId(UUID.randomUUID());

        // Generate PDF bytes and assert no exception is thrown
        byte[] pdfBytes = assertDoesNotThrow(() -> pdfGenerationService.generateQuotePdf(mockQuote, mockLead));
        
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }
}
