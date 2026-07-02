package com.eventos.auth.service;

import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class WorkspaceService {

    private final CompanyRepository companyRepository;
    private final TenantRepository tenantRepository;

    public WorkspaceService(CompanyRepository companyRepository, TenantRepository tenantRepository) {
        this.companyRepository = companyRepository;
        this.tenantRepository = tenantRepository;
    }

    public Company getWorkspaceSettings(UUID tenantId) {
        List<Company> companies = companyRepository.findByTenantId(tenantId);
        if (companies.isEmpty()) {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
            Company company = Company.builder()
                    .tenantId(tenantId)
                    .name(tenant.getName())
                    .timezone("Asia/Kolkata")
                    .currency("INR")
                    .build();
            return companyRepository.save(company);
        }
        return companies.get(0);
    }

    @Transactional
    public Company updateWorkspaceSettings(UUID tenantId, Company updatedCompany) {
        Company company = getWorkspaceSettings(tenantId);
        
        if (updatedCompany.getName() != null) {
            company.setName(updatedCompany.getName());
            // Sync with Tenant name
            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
            if (tenant != null) {
                tenant.setName(updatedCompany.getName());
                tenantRepository.save(tenant);
            }
        }
        if (updatedCompany.getLogoUrl() != null) company.setLogoUrl(updatedCompany.getLogoUrl());
        if (updatedCompany.getSlug() != null) company.setSlug(updatedCompany.getSlug());
        if (updatedCompany.getEmail() != null) company.setEmail(updatedCompany.getEmail());
        if (updatedCompany.getPhone() != null) company.setPhone(updatedCompany.getPhone());
        if (updatedCompany.getWebsite() != null) company.setWebsite(updatedCompany.getWebsite());
        if (updatedCompany.getAddress() != null) company.setAddress(updatedCompany.getAddress());
        if (updatedCompany.getGstNumber() != null) company.setGstNumber(updatedCompany.getGstNumber());
        if (updatedCompany.getPanNumber() != null) company.setPanNumber(updatedCompany.getPanNumber());
        if (updatedCompany.getRegistrationNumber() != null) company.setRegistrationNumber(updatedCompany.getRegistrationNumber());
        if (updatedCompany.getTimezone() != null) company.setTimezone(updatedCompany.getTimezone());
        if (updatedCompany.getCurrency() != null) company.setCurrency(updatedCompany.getCurrency());
        if (updatedCompany.getDateFormat() != null) company.setDateFormat(updatedCompany.getDateFormat());
        if (updatedCompany.getLanguage() != null) company.setLanguage(updatedCompany.getLanguage());
        if (updatedCompany.getBusinessHours() != null) company.setBusinessHours(updatedCompany.getBusinessHours());
        
        return companyRepository.save(company);
    }
}
