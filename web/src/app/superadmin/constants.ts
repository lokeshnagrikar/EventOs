export const ADMIN_ROLES = [
  { id: "super_admin", name: "Super Admin", desc: "Full root access to all management operations", color: "from-red-500 to-rose-600" },
  { id: "operations", name: "Operations", desc: "Manage tenants, feature rollouts, and backups", color: "from-orange-500 to-amber-600" },
  { id: "support_agent", name: "Support Agent", desc: "Answer customer tickets, bug reports, and chat", color: "from-emerald-500 to-teal-600" },
  { id: "finance_admin", name: "Finance Admin", desc: "Manage payments, invoices, refunds, and coupons", color: "from-blue-500 to-cyan-600" },
  { id: "developer", name: "Developer", desc: "Monitor system health, view server logs, and flags", color: "from-purple-500 to-indigo-600" },
  { id: "auditor", name: "Read Only Auditor", desc: "Read-only access to audit logs and metrics", color: "from-zinc-500 to-zinc-600" }
];
