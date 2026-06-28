package com.eventos.event.repository;

import com.eventos.event.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {
    List<PricingRule> findAllByTenantId(UUID tenantId);
    Optional<PricingRule> findByTenantIdAndCategoryAndRuleKey(UUID tenantId, com.eventos.event.entity.PricingCategory category, String ruleKey);
    Optional<PricingRule> findByIdAndTenantId(UUID id, UUID tenantId);

    void deleteByIdAndTenantId(UUID id, UUID tenantId);
}
