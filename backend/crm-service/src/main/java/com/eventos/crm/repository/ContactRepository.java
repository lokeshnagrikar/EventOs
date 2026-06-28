package com.eventos.crm.repository;

import com.eventos.crm.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {
    
    Optional<Contact> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
    
    Optional<Contact> findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(String email, UUID tenantId);
    
    List<Contact> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId);
    
    Page<Contact> findAllByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    @Query("SELECT c FROM Contact c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND " +
           "(lower(c.firstName) LIKE lower(concat('%', :query, '%')) OR " +
           "lower(c.lastName) LIKE lower(concat('%', :query, '%')) OR " +
           "lower(c.email) LIKE lower(concat('%', :query, '%')))")
    Page<Contact> searchContacts(@Param("tenantId") UUID tenantId, @Param("query") String query, Pageable pageable);
}
