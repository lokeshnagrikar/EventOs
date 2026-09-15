package com.eventos.auth.config;

import java.security.Principal;
import java.util.UUID;

public class UserPrincipal implements Principal {
    private final UUID userId;
    private final UUID tenantId;
    private final String email;
    private final String roles;
    private final boolean impersonated;
    private final UUID originalAdminId;

    @Override
    public String getName() {
        return userId != null ? userId.toString() : (email != null ? email : "anonymous");
    }

    public UserPrincipal(UUID userId, UUID tenantId, String email, String roles) {
        this(userId, tenantId, email, roles, false, null);
    }

    public UserPrincipal(UUID userId, UUID tenantId, String email, String roles, boolean impersonated, UUID originalAdminId) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.email = email;
        this.roles = roles;
        this.impersonated = impersonated;
        this.originalAdminId = originalAdminId;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public String getEmail() {
        return email;
    }

    public String getRoles() {
        return roles;
    }

    public boolean isImpersonated() {
        return impersonated;
    }

    public UUID getOriginalAdminId() {
        return originalAdminId;
    }

    public UUID getEffectiveUserId() {
        return userId;
    }

    public UUID getEffectiveTenantId() {
        return tenantId;
    }

    public String getEffectiveRoles() {
        return roles;
    }
}
