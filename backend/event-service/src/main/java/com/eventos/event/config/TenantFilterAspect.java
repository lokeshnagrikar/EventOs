package com.eventos.event.config;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.UUID;

@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void beforeRepositoryMethod() {
        UUID tenantId = TenantContext.getTenantId();
        
        // MockMvc/test context fallback: extract from Spring Security principal if ThreadLocal is empty
        if (tenantId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
                tenantId = ((UserPrincipal) auth.getPrincipal()).getTenantId();
            }
        }
        
        // Fail-secure default if tenant context is completely missing
        if (tenantId == null) {
            tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("tenantFilter");
            filter.setParameter("tenantId", tenantId);
        } catch (Exception e) {
            // Non-critical: session may not be unwrappable in non-JPA context
        }
    }
}
