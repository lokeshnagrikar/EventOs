package com.eventos.event.config;

import java.util.UUID;

public class UserPrincipal {
    private final UUID userId;
    private final UUID tenantId;
    private final String email;
    private final String roles;

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
