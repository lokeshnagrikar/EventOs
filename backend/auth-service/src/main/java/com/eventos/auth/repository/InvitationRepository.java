package com.eventos.auth.repository;

import com.eventos.auth.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    
    Optional<Invitation> findByTokenHash(String tokenHash);
    
    List<Invitation> findAllByTenantId(UUID tenantId);
    
    Optional<Invitation> findByEmailAndTenantIdAndStatus(String email, UUID tenantId, String status);
}
