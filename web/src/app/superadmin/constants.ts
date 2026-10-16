export const ADMIN_ROLES = [
  { id: "super_admin", name: "Super Admin (Root God Mode)", desc: "Full root clearance across all platform operations and tenants", color: "from-red-500 to-rose-600" },
  { id: "operations", name: "Operations Lead", desc: "Manage tenant provisioning, life cycles, and announcements", color: "from-orange-500 to-amber-600" },
  { id: "support_agent", name: "Support Lead", desc: "Handle agency tickets, user accounts, and credentials assistance", color: "from-emerald-500 to-teal-600" },
  { id: "finance_admin", name: "Finance Officer", desc: "SaaS revenue, subscription plans, tenant invoices, and billing overrides", color: "from-blue-500 to-cyan-600" },
  { id: "developer", name: "DevOps & SaaS Developer", desc: "Microservices telemetry, system diagnostics, WAF security, and feature flags", color: "from-purple-500 to-indigo-600" },
  { id: "auditor", name: "Compliance Auditor (Read-Only)", desc: "Strict read-only forensic audit trail and compliance verification", color: "from-zinc-500 to-zinc-600" }
];
