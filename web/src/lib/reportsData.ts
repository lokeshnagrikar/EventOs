// ─── Export & Reporting Utility Data Layer ──────────────────────────────────

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "Finance" | "Sales" | "Operations" | "System";
  icon: string;
  isFavorite?: boolean;
  sharedWithWorkspace?: boolean;
}

export interface ExportHistoryLogItem {
  id: string;
  generatedBy: string;
  date: string;
  module: string;
  format: "CSV" | "Excel" | "PDF" | "JSON" | "ZIP";
  size: string;
  status: "ready" | "processing" | "failed";
}

export interface ScheduledReportItem {
  id: string;
  name: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  format: "CSV" | "Excel" | "PDF" | "JSON";
  recipients: string[];
  lastSent: string;
  nextSent: string;
  active: boolean;
}

export interface ReportSource {
  id: string;
  name: string;
  columns: { key: string; label: string; type: "string" | "number" | "date" }[];
  mockData: Record<string, any>[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCES & COLUMNS
// ═══════════════════════════════════════════════════════════════════════════════

export const REPORT_SOURCES: ReportSource[] = [
  {
    id: "leads",
    name: "CRM Leads & Pipeline",
    columns: [
      { key: "name", label: "Client Name", type: "string" },
      { key: "email", label: "Email Address", type: "string" },
      { key: "phone", label: "Phone Number", type: "string" },
      { key: "eventType", label: "Event Type", type: "string" },
      { key: "budget", label: "Budget (INR)", type: "number" },
      { key: "status", label: "Pipeline Status", type: "string" },
      { key: "date", label: "Created Date", type: "date" },
    ],
    mockData: [],
  },
  {
    id: "invoices",
    name: "Finance Invoices",
    columns: [
      { key: "invoiceNumber", label: "Invoice Number", type: "string" },
      { key: "clientName", label: "Client Name", type: "string" },
      { key: "amount", label: "Amount (INR)", type: "number" },
      { key: "tax", label: "GST Tax (18%)", type: "number" },
      { key: "status", label: "Invoice Status", type: "string" },
      { key: "dueDate", label: "Due Date", type: "date" },
    ],
    mockData: [],
  },
  {
    id: "events",
    name: "Events Planner",
    columns: [
      { key: "name", label: "Event Name", type: "string" },
      { key: "eventType", label: "Event Type", type: "string" },
      { key: "venue", label: "Venue Location", type: "string" },
      { key: "budget", label: "Total Budget", type: "number" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "status", label: "Status", type: "string" },
    ],
    mockData: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: "temp-1", name: "Monthly Revenue Statement", description: "Comprehensive breakdown of gross revenue, taxes, discounts, and payment methods.", category: "Finance", icon: "DollarSign", isFavorite: true, sharedWithWorkspace: true },
  { id: "temp-2", name: "GST Tax Reconciliation", description: "Tax report tracking CGST/SGST/IGST liability and invoice tax collections.", category: "Finance", icon: "FileText", isFavorite: true, sharedWithWorkspace: true },
  { id: "temp-3", name: "Outstanding Payments Ledger", description: "List of all unpaid, overdue, and pending client invoices with days outstanding.", category: "Finance", icon: "TrendingUp" },
  { id: "temp-4", name: "Lead Capture Conversion Rates", description: "Analysis of leads won vs lost, conversion velocity, and performance per sales rep.", category: "Sales", icon: "Users", isFavorite: true },
  { id: "temp-5", name: "Upcoming Events Schedule", description: "Planning details, venues, and assigned coordinators for the next 90 days.", category: "Operations", icon: "Calendar", isFavorite: false, sharedWithWorkspace: true },
  { id: "temp-6", name: "Gallery Storage & Downloads", description: "Media gallery storage usage, image views count, and client download logs.", category: "System", icon: "Image" },
  { id: "temp-7", name: "Team Task Productivity", description: "Tasks completed, overdue issues, and response rates across agency staff.", category: "Operations", icon: "Layers" },
  { id: "temp-8", name: "Security Audit Logs", description: "Full audit trails of user logins, role privilege updates, and configuration edits.", category: "System", icon: "Shield" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT HISTORY LEDGER
// ═══════════════════════════════════════════════════════════════════════════════

export const EXPORT_HISTORY_INITIAL: ExportHistoryLogItem[] = [
  { id: "EXP-98A7B6", generatedBy: "Roy Wedding Admin", date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), module: "Finance Invoices", format: "PDF", size: "2.4 MB", status: "ready" },
  { id: "EXP-54C3D2", generatedBy: "Roy Wedding Admin", date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), module: "CRM Leads & Pipeline", format: "CSV", size: "480 KB", status: "ready" },
  { id: "EXP-12E5F9", generatedBy: "Roy Wedding Admin", date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), module: "Events Planner", format: "Excel", size: "1.2 MB", status: "ready" },
  { id: "EXP-88F4A1", generatedBy: "Roy Wedding Admin", date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), module: "Security Audit Logs", format: "JSON", size: "850 KB", status: "ready" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════════

export const SCHEDULED_REPORTS_INITIAL: ScheduledReportItem[] = [
  {
    id: "SCH-001",
    name: "Weekly Sales & Lead Pipeline Summary",
    frequency: "Weekly",
    format: "PDF",
    recipients: ["ceo@eventos.dev", "sales@eventos.dev"],
    lastSent: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    nextSent: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    active: true,
  },
  {
    id: "SCH-002",
    name: "Monthly Tax & GST Invoice Ledger",
    frequency: "Monthly",
    format: "Excel",
    recipients: ["billing@eventos.dev", "finance-team@eventos.dev"],
    lastSent: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    nextSent: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
    active: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT GENERATORS (Simulates data format conversion)
// ═══════════════════════════════════════════════════════════════════════════════

export function generateCSVContent(columns: { key: string; label: string }[], data: Record<string, any>[]): string {
  const headers = columns.map((col) => col.label).join(",");
  const rows = data.map((row) => {
    return columns.map((col) => {
      const val = row[col.key] ?? "";
      return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",");
  }).join("\n");
  return `${headers}\n${rows}`;
}

export function generateJSONContent(data: Record<string, any>[]): string {
  return JSON.stringify(data, null, 2);
}
