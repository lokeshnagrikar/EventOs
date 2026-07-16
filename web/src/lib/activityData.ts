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

export const INITIAL_AUDIT_LOGS: AdvancedAuditLog[] = [
  {
    id: "AUD-99A8",
    entityName: "Security",
    entityId: "sec-login-1",
    action: "FAILED_LOGIN",
    performedBy: "Unknown User",
    actorEmail: "unauthorized@hack.com",
    ipAddress: "198.162.0.45",
    severity: "critical",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    diffs: [
      { fieldName: "Login Attempt", previousValue: "None", newValue: "3 consecutive failed attempts on admin email" }
    ]
  },
  {
    id: "AUD-54C2",
    entityName: "Lead",
    entityId: "lead-298",
    action: "UPDATE",
    performedBy: "Sarah CS Agent",
    actorEmail: "sarah@eventos.dev",
    avatarUrl: "/avatars/sarah.png",
    ipAddress: "103.45.20.12",
    severity: "low",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    diffs: [
      { fieldName: "budget", previousValue: "INR 250,000", newValue: "INR 450,000" },
      { fieldName: "status", previousValue: "QUALIFIED", newValue: "NEGOTIATING" }
    ]
  },
  {
    id: "AUD-12B9",
    entityName: "Invoice",
    entityId: "inv-2026-045",
    action: "CREATE",
    performedBy: "Roy Wedding Admin",
    actorEmail: "roy@eventos.dev",
    ipAddress: "157.48.92.110",
    severity: "medium",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    diffs: [
      { fieldName: "Invoice Number", previousValue: "New draft", newValue: "INV-2026-045" },
      { fieldName: "Client Amount", previousValue: "0", newValue: "INR 180,000" }
    ]
  },
  {
    id: "AUD-88F4",
    entityName: "Quote",
    entityId: "q-190",
    action: "EXPORT",
    performedBy: "Roy Wedding Admin",
    actorEmail: "roy@eventos.dev",
    ipAddress: "157.48.92.110",
    severity: "high",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    diffs: [
      { fieldName: "Export Mode", previousValue: "Screen view", newValue: "Bulk Excel Export" }
    ]
  },
  {
    id: "AUD-30D1",
    entityName: "Security",
    entityId: "sec-2FA",
    action: "SETTINGS",
    performedBy: "Marcus Vance Studio",
    actorEmail: "marcus@vance.com",
    ipAddress: "103.20.122.90",
    severity: "high",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    diffs: [
      { fieldName: "Multi-Factor (2FA)", previousValue: "Disabled", newValue: "Enforced for all Workspace members" }
    ]
  },
  {
    id: "AUD-92A3",
    entityName: "Event",
    entityId: "evt-WeddingSiddharth",
    action: "RESTORE",
    performedBy: "Roy Wedding Admin",
    actorEmail: "roy@eventos.dev",
    ipAddress: "157.48.92.110",
    severity: "medium",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    diffs: [
      { fieldName: "Trash State", previousValue: "Deleted", newValue: "Restored to active planning board" }
    ]
  },
  {
    id: "AUD-66E8",
    entityName: "Security",
    entityId: "sec-permission-1",
    action: "DENIED",
    performedBy: "Coordinator Staff",
    actorEmail: "staff@eventos.dev",
    ipAddress: "103.45.20.50",
    severity: "critical",
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    diffs: [
      { fieldName: "Access Attempt", previousValue: "Allowed scope", newValue: "GET /superadmin/billing/delete" }
    ]
  }
];

export const MOCK_DEVICES_INITIAL = [
  { device: "MacBook Pro M3", browser: "Safari 17.4", ip: "157.48.92.110", location: "Mumbai, India", status: "Active Session", current: true },
  { device: "iPhone 15 Pro Max", browser: "Mobile Safari", ip: "157.48.92.110", location: "Mumbai, India", status: "Active Session", current: false },
  { device: "Windows 11 Workstation", browser: "Chrome 123.0", ip: "103.45.20.12", location: "Bangalore, India", status: "Last active 3 days ago", current: false },
];
