package com.eventos.auth.repository;

import com.eventos.auth.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {
    List<Company> findByTenantId(UUID tenantId);
}
