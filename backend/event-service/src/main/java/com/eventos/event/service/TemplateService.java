package com.eventos.event.service;

import com.eventos.event.entity.EmailTemplate;
import com.eventos.event.repository.EmailTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    public TemplateService(EmailTemplateRepository emailTemplateRepository) {
        this.emailTemplateRepository = emailTemplateRepository;
    }

    public List<EmailTemplate> getTemplates(UUID tenantId) {
        List<EmailTemplate> list = emailTemplateRepository.findAllByTenantId(tenantId);
        if (list.isEmpty()) {
            // Seed defaults
            list = new ArrayList<>();
            list.add(seedDefault(tenantId, "Welcome Email", "Welcome to EventOS!", 
                     "<h1>Welcome {{client_name}}!</h1><p>We are excited to help you plan your next event with {{company_name}}.</p>", 
                     "client_name,company_name"));
            list.add(seedDefault(tenantId, "Invoice", "Invoice {{invoice_number}} from {{company_name}}", 
                     "<h2>Dear {{client_name}},</h2><p>Your invoice {{invoice_number}} has been generated. Please view it using this link: <a href='{{payment_link}}'>Pay Now</a></p>", 
                     "client_name,invoice_number,company_name,payment_link"));
            list.add(seedDefault(tenantId, "Quote Sent", "New pricing proposal for {{event_name}}", 
                     "<h2>Hello {{client_name}},</h2><p>Here is your quotation for {{event_name}}. Please review it and accept using the portal.</p>", 
                     "client_name,event_name"));
            list.add(seedDefault(tenantId, "Team Invitation", "You've been invited to join {{company_name}} on EventOS", 
                     "<h2>Hello,</h2><p>You have been invited to join {{company_name}} as an organizer on EventOS. Click the link to register.</p>", 
                     "company_name"));
        }
        return list;
    }

    private EmailTemplate seedDefault(UUID tenantId, String name, String subject, String body, String vars) {
        EmailTemplate t = EmailTemplate.builder()
                .tenantId(tenantId)
                .templateName(name)
                .subject(subject)
                .htmlBody(body)
                .variablesList(vars)
                .version(1)
                .build();
        return emailTemplateRepository.save(t);
    }

    public Optional<EmailTemplate> getTemplateByName(UUID tenantId, String name) {
        getTemplates(tenantId); // ensure seeded
        return emailTemplateRepository.findByTenantIdAndTemplateName(tenantId, name);
    }

    @Transactional
    public EmailTemplate updateTemplate(UUID tenantId, String name, EmailTemplate details) {
        EmailTemplate t = emailTemplateRepository.findByTenantIdAndTemplateName(tenantId, name)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + name));

        t.setSubject(details.getSubject());
        t.setHtmlBody(details.getHtmlBody());
        t.setVersion(t.getVersion() + 1);
        return emailTemplateRepository.save(t);
    }
}
