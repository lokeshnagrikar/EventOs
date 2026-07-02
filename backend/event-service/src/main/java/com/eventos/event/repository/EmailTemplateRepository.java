package com.eventos.event.repository;

import com.eventos.event.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {
    List<EmailTemplate> findAllByTenantId(UUID tenantId);
    Optional<EmailTemplate> findByTenantIdAndTemplateName(UUID tenantId, String templateName);
}
