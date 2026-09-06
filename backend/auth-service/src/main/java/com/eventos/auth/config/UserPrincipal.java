package com.eventos.auth.config;

import java.security.Principal;
import java.util.UUID;

public class UserPrincipal implements Principal {
    private final UUID userId;
    private final UUID tenantId;
    private final String email;
    private final String roles;

    @Override
    public String getName() {
        return userId != null ? userId.toString() : (email != null ? email : "anonymous");
    }

    public UserPrincipal(UUID userId, UUID tenantId, String email, String roles) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.email = email;
        this.roles = roles;
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
}
