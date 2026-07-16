package com.eventos.auth.repository;

import com.eventos.auth.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, UUID> {
    List<PaymentMethod> findByTenantId(UUID tenantId);
    List<PaymentMethod> findByTenantIdAndIsDefaultTrue(UUID tenantId);
}
