package com.eventos.crm.service;

import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.Quote;
import com.eventos.crm.entity.QuoteItem;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGenerationService {

    private static final Logger log = LoggerFactory.getLogger(PdfGenerationService.class);

    public byte[] generateQuotePdf(Quote quote, Lead lead) {
        log.info("Generating PDF for Quote: {} using template: {}", quote.getQuoteNumber(), quote.getTemplateName());
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Set up template-specific color palette
            Color primaryColor = new Color(79, 70, 229); // Default Indigo/Blue
            Color textColor = new Color(31, 41, 55);
            Color headerBg = new Color(243, 244, 246);
            String titleLabel = "PROPOSAL & ESTIMATE";

            String template = quote.getTemplateName();
            if ("ELEGANT".equalsIgnoreCase(template)) {
                primaryColor = new Color(219, 39, 119); // Rose/Pink
                textColor = new Color(67, 20, 30);
                headerBg = new Color(253, 242, 248);
                titleLabel = "WEDDING CELEBRATION PROPOSAL";
            } else if ("PLAYFUL".equalsIgnoreCase(template)) {
                primaryColor = new Color(5, 150, 105); // Emerald/Green
                textColor = new Color(6, 78, 59);
                headerBg = new Color(236, 253, 245);
                titleLabel = "BIRTHDAY GALA PRICING PROPOSAL";
            } else { // MINIMALIST
                primaryColor = new Color(59, 130, 246); // Blue
                textColor = new Color(17, 24, 39);
                headerBg = new Color(249, 250, 251);
                titleLabel = "CORPORATE EVENTS WORK AGREEMENT";
            }

            // Fonts setup
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, textColor);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textColor);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9, textColor);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

            // Document Header / Title
            Paragraph title = new Paragraph(titleLabel, titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subtitle = new Paragraph("EventOS Business Operations Workspace", smallFont);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Metadata Grid Table (Quote Number, Date, Status)
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{1f, 1f});

            // Quote Specs
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("Proposal Number: " + quote.getQuoteNumber(), boldFont));
            leftCell.addElement(new Paragraph("Date Generated: " + quote.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), regularFont));
            leftCell.addElement(new Paragraph("Status: " + quote.getStatus().name(), boldFont));
            metaTable.addCell(leftCell);

            // Company Specs
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph providerHeader = new Paragraph("Provider Info:", boldFont);
            providerHeader.setAlignment(Element.ALIGN_RIGHT);
            Paragraph providerName = new Paragraph("EventOS Planner Corp", boldFont);
            providerName.setAlignment(Element.ALIGN_RIGHT);
            Paragraph providerEmail = new Paragraph("workspace@eventos.com", regularFont);
            providerEmail.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(providerHeader);
            rightCell.addElement(providerName);
            rightCell.addElement(providerEmail);
            metaTable.addCell(rightCell);

            metaTable.setSpacingAfter(20);
            document.add(metaTable);

            // Divider Line
            Paragraph line = new Paragraph("______________________________________________________________________________", smallFont);
            line.setSpacingAfter(15);
            document.add(line);

            // Client Info Section
            PdfPTable clientTable = new PdfPTable(1);
            clientTable.setWidthPercentage(100);
            PdfPCell clientCell = new PdfPCell();
            clientCell.setBorder(Rectangle.NO_BORDER);
            clientCell.addElement(new Paragraph("PREPARED FOR:", smallFont));
            clientCell.addElement(new Paragraph(lead != null ? lead.getName() : "Valued Client", headingFont));
            clientCell.addElement(new Paragraph(lead != null && lead.getEmail() != null ? lead.getEmail() : "No Email Provided", regularFont));
            clientCell.addElement(new Paragraph(lead != null && lead.getPhone() != null ? lead.getPhone() : "No Phone Provided", regularFont));
            clientTable.addCell(clientCell);
            clientTable.setSpacingAfter(25);
            document.add(clientTable);

            // Line Items Table
            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{3f, 3f, 1.5f, 1f, 1.5f});

            // Table Header Rows
            String[] headers = {"Service Name", "Description", "Unit Price", "Qty", "Total"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, boldFont));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(6);
                cell.setBorderColor(Color.LIGHT_GRAY);
                if ("Qty".equals(header)) {
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                } else if ("Unit Price".equals(header) || "Total".equals(header)) {
                    cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                }
                itemsTable.addCell(cell);
            }

            // Populate rows
            for (QuoteItem item : quote.getItems()) {
                PdfPCell nameCell = new PdfPCell(new Phrase(item.getItemName(), boldFont));
                nameCell.setPadding(6);
                nameCell.setBorderColor(Color.LIGHT_GRAY);
                itemsTable.addCell(nameCell);

                PdfPCell descCell = new PdfPCell(new Phrase(item.getDescription() != null ? item.getDescription() : "", regularFont));
                descCell.setPadding(6);
                descCell.setBorderColor(Color.LIGHT_GRAY);
                itemsTable.addCell(descCell);

                PdfPCell priceCell = new PdfPCell(new Phrase("INR " + item.getUnitPrice().setScale(2).toString(), regularFont));
                priceCell.setPadding(6);
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                priceCell.setBorderColor(Color.LIGHT_GRAY);
                itemsTable.addCell(priceCell);

                PdfPCell qtyCell = new PdfPCell(new Phrase(item.getQuantity().toString(), regularFont));
                qtyCell.setPadding(6);
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                qtyCell.setBorderColor(Color.LIGHT_GRAY);
                itemsTable.addCell(qtyCell);

                PdfPCell totalCell = new PdfPCell(new Phrase("INR " + item.getTotal().setScale(2).toString(), boldFont));
                totalCell.setPadding(6);
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                totalCell.setBorderColor(Color.LIGHT_GRAY);
                itemsTable.addCell(totalCell);
            }

            itemsTable.setSpacingAfter(20);
            document.add(itemsTable);

            // Pricing Summary Grid (Subtotal, Discount, Tax, Grand Total)
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{2f, 1f});

            // Notes Block (left side of summary grid)
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.NO_BORDER);
            if (quote.getClientNotes() != null && !quote.getClientNotes().isEmpty()) {
                notesCell.addElement(new Paragraph("Client Notes:", boldFont));
                notesCell.addElement(new Paragraph(quote.getClientNotes(), regularFont));
            }
            summaryTable.addCell(notesCell);

            // Calculation Block (right side of summary grid)
            PdfPCell calcCell = new PdfPCell();
            calcCell.setBorder(Rectangle.NO_BORDER);
            
            PdfPTable calcSubTable = new PdfPTable(2);
            calcSubTable.setWidthPercentage(100);
            calcSubTable.setWidths(new float[]{1.5f, 1f});

            addSummaryRow(calcSubTable, "Subtotal:", "INR " + quote.getSubtotal().setScale(2).toString(), regularFont, regularFont);
            addSummaryRow(calcSubTable, "Discount:", "- INR " + quote.getDiscount().setScale(2).toString(), regularFont, regularFont);
            addSummaryRow(calcSubTable, "Tax:", "+ INR " + quote.getTax().setScale(2).toString(), regularFont, regularFont);
            addSummaryRow(calcSubTable, "Grand Total:", "INR " + quote.getTotal().setScale(2).toString(), boldFont, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, primaryColor));

            calcCell.addElement(calcSubTable);
            summaryTable.addCell(calcCell);

            summaryTable.setSpacingAfter(30);
            document.add(summaryTable);

            // Terms and Conditions Footer Block
            if (quote.getTermsConditions() != null && !quote.getTermsConditions().isEmpty()) {
                Paragraph tcHeader = new Paragraph("Terms & Conditions", boldFont);
                tcHeader.setSpacingAfter(4);
                document.add(tcHeader);

                Paragraph tcBody = new Paragraph(quote.getTermsConditions(), smallFont);
                tcBody.setSpacingAfter(20);
                document.add(tcBody);
            }

            // Page Signature
            Paragraph footer = new Paragraph("Thank you for choosing EventOS. Looking forward to working together!", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for Quote: {}", quote.getQuoteNumber(), e);
            throw new RuntimeException("Failed to generate PDF document", e);
        }
    }

    private void addSummaryRow(PdfPTable table, String label, String val, Font labelFont, Font valFont) {
        PdfPCell lblCell = new PdfPCell(new Phrase(label, labelFont));
        lblCell.setBorder(Rectangle.NO_BORDER);
        lblCell.setPadding(3);
        table.addCell(lblCell);

        PdfPCell valCell = new PdfPCell(new Phrase(val, valFont));
        valCell.setBorder(Rectangle.NO_BORDER);
        valCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valCell.setPadding(3);
        table.addCell(valCell);
    }
}
