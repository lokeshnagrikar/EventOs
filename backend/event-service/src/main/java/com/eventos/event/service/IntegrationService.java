package com.eventos.event.service;

import com.eventos.event.entity.Integration;
import com.eventos.event.repository.IntegrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class IntegrationService {

    private final IntegrationRepository integrationRepository;
    private static final String[] PROVIDERS = {"CLOUDINARY", "GOOGLE_CALENDAR", "TWILIO", "SLACK", "ZOOM", "STRIPE", "RAZORPAY", "SMTP"};

    public IntegrationService(IntegrationRepository integrationRepository) {
        this.integrationRepository = integrationRepository;
    }

    public List<Integration> getIntegrations(UUID tenantId) {
        List<Integration> list = new ArrayList<>();
        for (String provider : PROVIDERS) {
            Optional<Integration> opt = integrationRepository.findByTenantIdAndProviderName(tenantId, provider);
            if (opt.isPresent()) {
                list.add(opt.get());
            } else {
                Integration defaultIntegration = Integration.builder()
                        .tenantId(tenantId)
                        .providerName(provider)
                        .status("DISCONNECTED")
                        .credentialsJson("{}")
                        .build();
                list.add(defaultIntegration);
            }
        }
        return list;
    }

    @Transactional
    public Integration connectIntegration(UUID tenantId, String provider, String credentialsJson) {
        Integration integration = integrationRepository.findByTenantIdAndProviderName(tenantId, provider.toUpperCase())
                .orElseGet(() -> Integration.builder()
                        .tenantId(tenantId)
                        .providerName(provider.toUpperCase())
                        .build());

        integration.setCredentialsJson(credentialsJson);
        integration.setStatus("CONNECTED");
        integration.setLastSyncAt(LocalDateTime.now());
        return integrationRepository.save(integration);
    }

    @Transactional
    public Integration disconnectIntegration(UUID tenantId, String provider) {
        Integration integration = integrationRepository.findByTenantIdAndProviderName(tenantId, provider.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Integration not found: " + provider));

        integration.setStatus("DISCONNECTED");
        integration.setCredentialsJson("{}");
        return integrationRepository.save(integration);
    }
}
