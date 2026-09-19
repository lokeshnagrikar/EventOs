// ─── Activity & Audit Logs Data Layer ───────────────────────────────────────

export interface EntityDiff {
  fieldName: string;
  previousValue: string;
  newValue: string;
}

export interface AdvancedAuditLog {
  id: string;
  entityName: "Lead" | "Event" | "Invoice" | "Quote" | "Gallery" | "Security" | "System" | "Member";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "EXPORT" | "IMPORT" | "LOGIN" | "FAILED_LOGIN" | "DENIED" | "SETTINGS";
  performedBy: string; // User Name
  actorEmail: string;
  avatarUrl?: string;
  ipAddress: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  notes?: string;
  isPinned?: boolean;
  diffs?: EntityDiff[];
}

export const INITIAL_AUDIT_LOGS: AdvancedAuditLog[] = [];

export const MOCK_DEVICES_INITIAL: {
  device: string;
  browser: string;
  ip: string;
  location: string;
  status: string;
  current: boolean;
}[] = [];
