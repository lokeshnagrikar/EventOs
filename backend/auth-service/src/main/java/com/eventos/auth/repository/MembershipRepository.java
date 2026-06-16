package com.eventos.auth.repository;

import com.eventos.auth.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, UUID> {
    List<Membership> findAllByUserId(UUID userId);
    List<Membership> findAllByTenantId(UUID tenantId);
    Optional<Membership> findByUserIdAndTenantId(UUID userId, UUID tenantId);
}
