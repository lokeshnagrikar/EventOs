package com.eventos.auth.config;

import java.util.Collections;
import java.util.Set;

/**
 * Server-authoritative platform roles and their corresponding granular permissions.
 * Defines the strict Role-Based Access Control (RBAC) matrix for EventOS SuperAdmin operations.
 */
public enum PlatformRole {
    SUPER_ADMIN("SUPER_ADMIN", Set.of(
        "admin:all",
        "admin:read",
        "tenant:read",
        "tenant:write",
        "tenant:user:status",
        "tenant:impersonate",
        "user:read",
        "user:password-reset",
        "billing:read",
        "billing:write",
        "blacklist:read",
        "blacklist:write",
        "announcements:read",
        "announcements:write",
        "audit:read",
        "telemetry:read"
    )),

    OPERATIONS_LEAD("OPERATIONS_LEAD", Set.of(
        "admin:read",
        "tenant:read",
        "tenant:write",
        "tenant:user:status",
        "user:read",
        "announcements:read",
        "announcements:write",
        "audit:read"
    )),

    SUPPORT_LEAD("SUPPORT_LEAD", Set.of(
        "admin:read",
        "tenant:read",
        "user:read",
        "user:password-reset",
        "announcements:read",
        "audit:read"
    )),

    FINANCE_OFFICER("FINANCE_OFFICER", Set.of(
        "admin:read",
        "tenant:read",
        "billing:read",
        "billing:write",
        "audit:read"
    )),

    DEVOPS_ENGINEER("DEVOPS_ENGINEER", Set.of(
        "admin:read",
        "telemetry:read",
        "audit:read"
    )),

    COMPLIANCE_AUDITOR("COMPLIANCE_AUDITOR", Set.of(
        "admin:read",
        "tenant:read",
        "user:read",
        "billing:read",
        "blacklist:read",
        "announcements:read",
        "audit:read",
        "telemetry:read"
    ));

    private final String roleName;
    private final Set<String> permissions;

    PlatformRole(String roleName, Set<String> permissions) {
        this.roleName = roleName;
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public String getRoleName() {
        return roleName;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public static PlatformRole fromRoleName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String clean = name.trim().toUpperCase();
        for (PlatformRole r : values()) {
            if (r.roleName.equals(clean)) {
                return r;
            }
        }
        return null;
    }

    public static boolean isPlatformRole(String name) {
        return fromRoleName(name) != null;
    }
}
