package com.eventos.crm.service;

import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.dto.CreateQuoteItemDto;
import com.eventos.crm.entity.*;
import com.eventos.crm.event.QuotePdfGenerationEvent;
import com.eventos.crm.repository.LeadRepository;
import com.eventos.crm.repository.QuoteRepository;
import com.eventos.crm.repository.TenantSequenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuoteServiceTest {

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private LeadService leadService;

    @Mock
    private TenantSequenceRepository tenantSequenceRepository;

    @Mock
    private PdfGenerationService pdfGenerationService;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private QuoteService quoteService;

    private UUID tenantId;
    private UUID leadId;
    private Lead mockLead;
    private Quote mockQuote;
    private Contact mockContact;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        leadId = UUID.randomUUID();

        mockContact = Contact.builder()
                .id(UUID.randomUUID())
                .firstName("Verma")
                .lastName("Reception")
                .email("verma@gmail.com")
                .phone("1234567890")
                .build();
        mockContact.setTenantId(tenantId);

        mockLead = Lead.builder()
                .id(leadId)
                .name("Verma Reception")
                .contact(mockContact)
                .eventType("WEDDING")
                .budget(BigDecimal.valueOf(600000))
                .status(LeadStatus.NEGOTIATION)
                .build();
        mockLead.setTenantId(tenantId);

        mockQuote = Quote.builder()
                .id(UUID.randomUUID())
                .leadId(leadId)
                .quoteNumber("QT-0001-v1")
                .status(QuoteStatus.DRAFT)
                .subtotal(BigDecimal.valueOf(100000))
                .discount(BigDecimal.valueOf(10000))
                .tax(BigDecimal.valueOf(16200)) // 18% GST of 90000
                .total(BigDecimal.valueOf(106200))
                .revisionNumber(1)
                .build();
        mockQuote.setTenantId(tenantId);
    }

    @Test
    void testGetAllQuotes() {
        when(quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId))
                .thenReturn(Collections.singletonList(mockQuote));

        List<Quote> quotes = quoteService.getAllQuotes(tenantId);

        assertNotNull(quotes);
        assertEquals(1, quotes.size());
        assertEquals("QT-0001-v1", quotes.get(0).getQuoteNumber());
        verify(quoteRepository, times(1)).findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Test
    void testCreateQuote_SuccessAndCalculations() {
        CreateQuoteItemDto itemDto = CreateQuoteItemDto.builder()
                .itemName("Floral Decor Setup")
                .unitPrice(BigDecimal.valueOf(50000))
                .quantity(2)
                .build();

        CreateQuoteDto dto = CreateQuoteDto.builder()
                .leadId(leadId)
                .templateName("ELEGANT")
                .discount(BigDecimal.valueOf(10000))
                .taxRate(BigDecimal.valueOf(18.00)) // 18% GST
                .clientNotes("Please install lights by Friday night.")
                .items(Collections.singletonList(itemDto))
                .build();

        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        
        TenantSequence mockSeq = TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("QUOTE")
                .currentValue(0)
                .build();
        
        when(tenantSequenceRepository.findByTenantIdAndSequenceTypeForUpdate(tenantId, "QUOTE"))
                .thenReturn(Optional.of(mockSeq));

        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Quote result = quoteService.createQuote(dto, tenantId);

        assertNotNull(result);
        assertEquals("QT-0001-v1", result.getQuoteNumber());
        assertEquals(QuoteStatus.DRAFT, result.getStatus());
        assertEquals(0, result.getSubtotal().compareTo(BigDecimal.valueOf(100000)));
        assertEquals(0, result.getDiscount().compareTo(BigDecimal.valueOf(10000)));
        assertEquals(0, result.getTax().compareTo(BigDecimal.valueOf(16200)));
        assertEquals(0, result.getTotal().compareTo(BigDecimal.valueOf(106200)));
        
        // Verifies the PDF generation event was published
        verify(eventPublisher, times(1)).publishEvent(any(QuotePdfGenerationEvent.class));
        verify(quoteRepository, times(1)).save(any(Quote.class));
    }

    @Test
    void testApproveQuote_TransitionsStatusAndTriggersLeadPromotion() {
        UUID quoteId = mockQuote.getId();
        UUID userId = UUID.randomUUID();

        // Approval is valid from VIEWED state
        mockQuote.setStatus(QuoteStatus.VIEWED);

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Quote result = quoteService.approveQuote(quoteId, tenantId, userId);

        assertNotNull(result);
        assertEquals(QuoteStatus.ACCEPTED, result.getStatus());
        assertNotNull(result.getApprovedAt());
        
        verify(leadService, times(1)).updateLeadStatus(leadId, LeadStatus.WON, tenantId, userId);
        verify(quoteRepository, times(2)).save(any(Quote.class));
        verify(eventPublisher, times(1)).publishEvent(any(QuotePdfGenerationEvent.class));
    }

    @Test
    void testApproveQuote_InvalidTransitionThrowsException() {
        UUID quoteId = mockQuote.getId();
        UUID userId = UUID.randomUUID();

        // Approve is invalid from DRAFT directly (must go DRAFT -> SENT -> VIEWED -> ACCEPTED)
        mockQuote.setStatus(QuoteStatus.DRAFT);

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));

        assertThrows(IllegalStateException.class, () -> {
            quoteService.approveQuote(quoteId, tenantId, userId);
        });

        verify(leadService, never()).updateLeadStatus(any(UUID.class), any(LeadStatus.class), any(UUID.class), any(UUID.class));
    }

    @Test
    void testMarkAsViewed_TransitionsStatus() {
        UUID quoteId = mockQuote.getId();
        mockQuote.setStatus(QuoteStatus.SENT);

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Quote result = quoteService.markAsViewed(quoteId, tenantId);

        assertNotNull(result);
        assertEquals(QuoteStatus.VIEWED, result.getStatus());
        verify(quoteRepository, times(1)).save(any(Quote.class));
        verify(eventPublisher, times(1)).publishEvent(any(QuotePdfGenerationEvent.class));
    }

    @Test
    void testGetQuoteById_TenantBoundaryIsolation() {
        UUID unauthorizedTenantId = UUID.randomUUID();
        when(quoteRepository.findByIdAndTenantId(mockQuote.getId(), unauthorizedTenantId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            quoteService.getQuoteById(mockQuote.getId(), unauthorizedTenantId);
        });

        verify(quoteRepository, times(1)).findByIdAndTenantId(mockQuote.getId(), unauthorizedTenantId);
    }

    @Test
    void testGetQuotesByClientEmail_Success() {
        String email = "verma@gmail.com";
        
        when(leadRepository.findByContactEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId))
                .thenReturn(Collections.singletonList(mockLead));
        when(quoteRepository.findAllByLeadIdAndTenantId(leadId, tenantId))
                .thenReturn(Collections.singletonList(mockQuote));

        List<Quote> quotes = quoteService.getQuotesByClientEmail(email, tenantId);

        assertNotNull(quotes);
        assertEquals(1, quotes.size());
        assertEquals("QT-0001-v1", quotes.get(0).getQuoteNumber());
        verify(leadRepository, times(1)).findByContactEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId);
        verify(quoteRepository, times(1)).findAllByLeadIdAndTenantId(leadId, tenantId);
    }

    @Test
    void testRejectQuote_Success() {
        UUID quoteId = mockQuote.getId();
        mockQuote.setStatus(QuoteStatus.VIEWED);

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Quote result = quoteService.rejectQuote(quoteId, tenantId);

        assertNotNull(result);
        assertEquals(QuoteStatus.REJECTED, result.getStatus());
        verify(quoteRepository, times(1)).save(any(Quote.class));
        verify(eventPublisher, times(1)).publishEvent(any(QuotePdfGenerationEvent.class));
    }

    @Test
    void testCreateRevision_Success() {
        UUID quoteId = mockQuote.getId();
        mockQuote.setStatus(QuoteStatus.ACCEPTED); // Can revise accepted quote
        
        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Quote revision = quoteService.createRevision(quoteId, tenantId);

        assertNotNull(revision);
        assertEquals("QT-0001-v2", revision.getQuoteNumber());
        assertEquals(QuoteStatus.DRAFT, revision.getStatus());
        assertEquals(2, revision.getRevisionNumber());
        assertEquals(quoteId, revision.getParentQuoteId());
        
        verify(quoteRepository, times(1)).save(any(Quote.class));
        verify(eventPublisher, times(1)).publishEvent(any(QuotePdfGenerationEvent.class));
    }

    @Test
    void testGenerateAndUploadPdfInBackground() throws Exception {
        UUID quoteId = mockQuote.getId();
        
        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        
        when(pdfGenerationService.generateQuotePdf(any(Quote.class), any(Lead.class)))
                .thenReturn(new byte[10]);
        when(cloudinaryService.uploadPdf(any(byte[].class), anyString()))
                .thenReturn("https://mockcloudinary.com/dummy.pdf");
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));

        quoteService.generateAndUploadPdfInBackground(quoteId, tenantId);

        assertEquals("https://mockcloudinary.com/dummy.pdf", mockQuote.getPdfUrl());
        verify(quoteRepository, times(1)).save(mockQuote);
    }
}
