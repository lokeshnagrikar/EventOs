package com.eventos.crm.service;

import com.eventos.crm.dto.PublicQuoteResponseDto;
import com.eventos.crm.entity.Contact;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.Quote;
import com.eventos.crm.entity.QuoteStatus;
import com.eventos.crm.event.QuotePdfGenerationEvent;
import com.eventos.crm.repository.LeadRepository;
import com.eventos.crm.repository.QuoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuotePublicSecurityTest {

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private LeadService leadService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private QuoteService quoteService;

    private UUID tenantId;
    private UUID quoteId;
    private String validShareToken;
    private Quote quote;
    private Lead lead;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        quoteId = UUID.randomUUID();
        validShareToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");

        Contact contact = Contact.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .phone("1234567890")
                .build();

        lead = Lead.builder()
                .name("Wedding Event")
                .contact(contact)
                .isDeleted(false)
                .build();
        lead.setId(UUID.randomUUID());
        lead.setTenantId(tenantId);

        quote = Quote.builder()
                .quoteNumber("QT-2026-0001")
                .revisionNumber(1)
                .leadId(lead.getId())
                .status(QuoteStatus.SENT)
                .subtotal(new BigDecimal("10000.00"))
                .tax(new BigDecimal("1800.00"))
                .total(new BigDecimal("11800.00"))
                .shareToken(validShareToken)
                .items(Collections.emptyList())
                .build();
        quote.setId(quoteId);
        quote.setTenantId(tenantId);
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote lookup with valid shareToken succeeds")
    void testGetPublicQuote_ValidShareToken_Succeeds() {
        when(quoteRepository.findByShareToken(validShareToken)).thenReturn(Optional.of(quote));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(lead.getId(), tenantId)).thenReturn(Optional.of(lead));

        PublicQuoteResponseDto response = quoteService.getPublicQuote(validShareToken);

        assertNotNull(response);
        assertEquals("QT-2026-0001", response.getQuoteNumber());
        assertEquals(validShareToken, response.getShareToken());
        assertEquals("Wedding Event", response.getEventName());
        verify(quoteRepository, times(1)).findByShareToken(validShareToken);
        verify(quoteRepository, never()).findById(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Sequential quoteNumber is rejected on public lookup")
    void testGetPublicQuote_SequentialQuoteNumber_Fails() {
        String quoteNumber = "QT-2026-0001";
        when(quoteRepository.findByShareToken(quoteNumber)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.getPublicQuote(quoteNumber));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, times(1)).findByShareToken(quoteNumber);
        verify(quoteRepository, never()).findById(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Raw quote UUID is rejected on public lookup")
    void testGetPublicQuote_RawQuoteUuid_Fails() {
        String rawUuid = quoteId.toString();
        when(quoteRepository.findByShareToken(rawUuid)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.getPublicQuote(rawUuid));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, times(1)).findByShareToken(rawUuid);
        verify(quoteRepository, never()).findById(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Invalid shareToken is rejected")
    void testGetPublicQuote_InvalidShareToken_Fails() {
        String invalidToken = "invalid-token-123456";
        when(quoteRepository.findByShareToken(invalidToken)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.getPublicQuote(invalidToken));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote approve with quoteNumber fails")
    void testApprovePublicQuote_WithQuoteNumber_Fails() {
        String quoteNumber = "QT-2026-0001";
        when(quoteRepository.findByShareToken(quoteNumber)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.approvePublicQuote(quoteNumber, "Client", "Sponsor"));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote approve with raw UUID fails")
    void testApprovePublicQuote_WithRawUuid_Fails() {
        String rawUuid = quoteId.toString();
        when(quoteRepository.findByShareToken(rawUuid)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.approvePublicQuote(rawUuid, "Client", "Sponsor"));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote reject with quoteNumber fails")
    void testRejectPublicQuote_WithQuoteNumber_Fails() {
        String quoteNumber = "QT-2026-0001";
        when(quoteRepository.findByShareToken(quoteNumber)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.rejectPublicQuote(quoteNumber, "Too expensive"));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote reject with raw UUID fails")
    void testRejectPublicQuote_WithRawUuid_Fails() {
        String rawUuid = quoteId.toString();
        when(quoteRepository.findByShareToken(rawUuid)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                quoteService.rejectPublicQuote(rawUuid, "Too expensive"));

        assertTrue(ex.getMessage().contains("Quote not found with provided share token"));
        verify(quoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote approve with valid shareToken succeeds")
    void testApprovePublicQuote_ValidShareToken_Succeeds() {
        when(quoteRepository.findByShareToken(validShareToken)).thenReturn(Optional.of(quote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(lead.getId(), tenantId)).thenReturn(Optional.of(lead));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(inv -> inv.getArgument(0));

        PublicQuoteResponseDto response = quoteService.approvePublicQuote(validShareToken, "Client Name", "Director");

        assertNotNull(response);
        assertEquals(QuoteStatus.ACCEPTED, quote.getStatus());
        verify(quoteRepository, times(1)).save(quote);
    }

    @Test
    @DisplayName("SEC-2M-01: Public quote reject with valid shareToken succeeds")
    void testRejectPublicQuote_ValidShareToken_Succeeds() {
        when(quoteRepository.findByShareToken(validShareToken)).thenReturn(Optional.of(quote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(lead.getId(), tenantId)).thenReturn(Optional.of(lead));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(inv -> inv.getArgument(0));

        PublicQuoteResponseDto response = quoteService.rejectPublicQuote(validShareToken, "Price is high");

        assertNotNull(response);
        assertEquals(QuoteStatus.REJECTED, quote.getStatus());
        verify(quoteRepository, times(1)).save(quote);
    }
}
