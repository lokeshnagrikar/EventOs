package com.eventos.crm.service;

import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.dto.CreateQuoteItemDto;
import com.eventos.crm.entity.*;
import com.eventos.crm.repository.LeadRepository;
import com.eventos.crm.repository.QuoteRepository;
import com.eventos.crm.repository.TenantSequenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.io.IOException;
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

    @InjectMocks
    private QuoteService quoteService;

    private UUID tenantId;
    private UUID leadId;
    private Lead mockLead;
    private Quote mockQuote;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        leadId = UUID.randomUUID();

        mockLead = Lead.builder()
                .id(leadId)
                .tenantId(tenantId)
                .name("Verma Reception")
                .eventType("WEDDING")
                .budget(BigDecimal.valueOf(600000))
                .status(LeadStatus.NEGOTIATION)
                .build();

        mockQuote = Quote.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .leadId(leadId)
                .quoteNumber("QT-0001")
                .status(QuoteStatus.DRAFT)
                .subtotal(BigDecimal.valueOf(100000))
                .discount(BigDecimal.valueOf(10000))
                .tax(BigDecimal.valueOf(16200)) // 18% GST of 90000
                .total(BigDecimal.valueOf(106200))
                .build();
    }

    @Test
    void testGetAllQuotes() {
        when(quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId))
                .thenReturn(Collections.singletonList(mockQuote));

        List<Quote> quotes = quoteService.getAllQuotes(tenantId);

        assertNotNull(quotes);
        assertEquals(1, quotes.size());
        assertEquals("QT-0001", quotes.get(0).getQuoteNumber());
        verify(quoteRepository, times(1)).findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Test
    void testCreateQuote_SuccessAndCalculations() throws IOException {
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
        when(pdfGenerationService.generateQuotePdf(any(Quote.class), any(Lead.class))).thenReturn(new byte[0]);
        when(cloudinaryService.uploadPdf(any(byte[].class), anyString())).thenReturn("https://mockcloudinary.com/dummy.pdf");

        Quote result = quoteService.createQuote(dto, tenantId);

        assertNotNull(result);
        assertEquals("QT-0001", result.getQuoteNumber());
        assertEquals(QuoteStatus.DRAFT, result.getStatus());
        assertEquals("https://mockcloudinary.com/dummy.pdf", result.getPdfUrl());
        assertEquals(0, result.getSubtotal().compareTo(BigDecimal.valueOf(100000)));
        assertEquals(0, result.getDiscount().compareTo(BigDecimal.valueOf(10000)));
        assertEquals(0, result.getTax().compareTo(BigDecimal.valueOf(16200)));
        assertEquals(0, result.getTotal().compareTo(BigDecimal.valueOf(106200)));
        
        // Verifies double save: initial save and save after adding pdfUrl
        verify(quoteRepository, times(2)).save(any(Quote.class));
        verify(cloudinaryService, times(1)).uploadPdf(any(byte[].class), anyString());
    }

    @Test
    void testApproveQuote_TriggersLeadPromotion() throws IOException {
        UUID quoteId = mockQuote.getId();
        UUID userId = UUID.randomUUID();

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pdfGenerationService.generateQuotePdf(any(Quote.class), any(Lead.class))).thenReturn(new byte[0]);
        when(cloudinaryService.uploadPdf(any(byte[].class), anyString())).thenReturn("https://mockcloudinary.com/dummy.pdf");

        Quote result = quoteService.approveQuote(quoteId, tenantId, userId);

        assertNotNull(result);
        assertEquals(QuoteStatus.ACCEPTED, result.getStatus());
        assertNotNull(result.getApprovedAt());
        assertEquals("https://mockcloudinary.com/dummy.pdf", result.getPdfUrl());
        
        // Assert that the Lead status is promoted to BOOKED
        verify(leadService, times(1)).updateLeadStatus(leadId, LeadStatus.BOOKED, tenantId, userId);
        verify(quoteRepository, times(2)).save(any(Quote.class));
    }

    @Test
    void testMarkAsViewed_TransitionsStatus() throws IOException {
        UUID quoteId = mockQuote.getId();

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pdfGenerationService.generateQuotePdf(any(Quote.class), any(Lead.class))).thenReturn(new byte[0]);
        when(cloudinaryService.uploadPdf(any(byte[].class), anyString())).thenReturn("https://mockcloudinary.com/dummy.pdf");

        Quote result = quoteService.markAsViewed(quoteId, tenantId);

        assertNotNull(result);
        assertEquals(QuoteStatus.VIEWED, result.getStatus());
        assertEquals("https://mockcloudinary.com/dummy.pdf", result.getPdfUrl());
        verify(quoteRepository, times(2)).save(any(Quote.class));
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
        mockLead.setEmail("verma@gmail.com");
        
        when(leadRepository.findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId))
                .thenReturn(Collections.singletonList(mockLead));
        when(quoteRepository.findAllByLeadIdAndTenantId(leadId, tenantId))
                .thenReturn(Collections.singletonList(mockQuote));

        List<Quote> quotes = quoteService.getQuotesByClientEmail(email, tenantId);

        assertNotNull(quotes);
        assertEquals(1, quotes.size());
        assertEquals("QT-0001", quotes.get(0).getQuoteNumber());
        verify(leadRepository, times(1)).findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId);
        verify(quoteRepository, times(1)).findAllByLeadIdAndTenantId(leadId, tenantId);
    }

    @Test
    void testRejectQuote_Success() throws IOException {
        UUID quoteId = mockQuote.getId();

        when(quoteRepository.findByIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockQuote));
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        when(quoteRepository.save(any(Quote.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pdfGenerationService.generateQuotePdf(any(Quote.class), any(Lead.class))).thenReturn(new byte[0]);
        when(cloudinaryService.uploadPdf(any(byte[].class), anyString())).thenReturn("https://mockcloudinary.com/dummy.pdf");

        Quote result = quoteService.rejectQuote(quoteId, tenantId);

        assertNotNull(result);
        assertEquals(QuoteStatus.REJECTED, result.getStatus());
        assertEquals("https://mockcloudinary.com/dummy.pdf", result.getPdfUrl());
        verify(quoteRepository, times(2)).save(any(Quote.class));
    }
}
