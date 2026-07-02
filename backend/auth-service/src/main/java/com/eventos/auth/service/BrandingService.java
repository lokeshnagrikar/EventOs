package com.eventos.auth.service;

import com.eventos.auth.entity.Company;
import com.eventos.auth.repository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class BrandingService {

    private final CompanyRepository companyRepository;
    private final WorkspaceService workspaceService;

    public BrandingService(CompanyRepository companyRepository, WorkspaceService workspaceService) {
        this.companyRepository = companyRepository;
        this.workspaceService = workspaceService;
    }

    public Company getBrandingSettings(UUID tenantId) {
        return workspaceService.getWorkspaceSettings(tenantId);
    }

    @Transactional
    public Company updateBrandingSettings(UUID tenantId, Company updatedBranding) {
        Company company = workspaceService.getWorkspaceSettings(tenantId);

        if (updatedBranding.getLogoUrl() != null) company.setLogoUrl(updatedBranding.getLogoUrl());
        if (updatedBranding.getFaviconUrl() != null) company.setFaviconUrl(updatedBranding.getFaviconUrl());
        if (updatedBranding.getCoverUrl() != null) company.setCoverUrl(updatedBranding.getCoverUrl());
        if (updatedBranding.getPrimaryColor() != null) company.setPrimaryColor(updatedBranding.getPrimaryColor());
        if (updatedBranding.getSecondaryColor() != null) company.setSecondaryColor(updatedBranding.getSecondaryColor());
        if (updatedBranding.getAccentColor() != null) company.setAccentColor(updatedBranding.getAccentColor());
        if (updatedBranding.getGradientPresets() != null) company.setGradientPresets(updatedBranding.getGradientPresets());
        if (updatedBranding.getFontSelection() != null) company.setFontSelection(updatedBranding.getFontSelection());
        if (updatedBranding.getDarkThemeLogo() != null) company.setDarkThemeLogo(updatedBranding.getDarkThemeLogo());
        if (updatedBranding.getEmailBranding() != null) company.setEmailBranding(updatedBranding.getEmailBranding());
        if (updatedBranding.getInvoiceBranding() != null) company.setInvoiceBranding(updatedBranding.getInvoiceBranding());
        if (updatedBranding.getPdfBranding() != null) company.setPdfBranding(updatedBranding.getPdfBranding());

        return companyRepository.save(company);
    }
}
