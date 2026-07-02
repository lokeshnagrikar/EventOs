import React from 'react';
import { useAuthStore } from '@/store/authStore';

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallback = null,
  children,
}) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  allowedPermissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  allowedPermissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = requireAll
    ? allowedPermissions.every((p) => permissions.includes(p))
    : allowedPermissions.some((p) => permissions.includes(p));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
