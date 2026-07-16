// ─── Import & Migration Data Layer ──────────────────────────────────────────

export interface ImportSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresFile: boolean;
  color: string;
}

export interface DataType {
  id: string;
  name: string;
  description: string;
  schemaFields: SchemaField[];
}

export interface SchemaField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "email" | "phone";
  required: boolean;
}

export interface ImportHistoryItem {
  id: string;
  date: string;
  fileName: string;
  source: string;
  dataType: string;
  recordsCount: number;
  skippedCount: number;
  errorCount: number;
  durationSeconds: number;
  status: "completed" | "rolled_back";
  user: string;
  impactSummary: {
    leadsCreated?: number;
    eventsCreated?: number;
    invoicesCreated?: number;
    contactsCreated?: number;
  };
}

export interface DemoDataset {
  id: string;
  name: string;
  description: string;
  dataType: string;
  headers: string[];
  rows: Record<string, string>[];
  suggestedMapping: Record<string, string>;
  validationReport: {
    totalRows: number;
    errorCount: number;
    warningCount: number;
    duplicateCount: number;
    issues: { rowIdx: number; colHeader: string; type: "error" | "warning"; message: string; value: string }[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCES & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const IMPORT_SOURCES: ImportSource[] = [
  { id: "csv", name: "Custom CSV", description: "Upload comma-separated files (.csv)", icon: "FileText", requiresFile: true, color: "from-purple-500 to-indigo-500" },
  { id: "xlsx", name: "Excel Spreadsheet", description: "Upload Excel spreadsheets (.xlsx)", icon: "FileSpreadsheet", requiresFile: true, color: "from-emerald-500 to-teal-500" },
  { id: "google-sheets", name: "Google Sheets", description: "Connect Google sheets via cloud share link", icon: "Globe", requiresFile: false, color: "from-blue-500 to-cyan-500" },
  { id: "honeybook", name: "HoneyBook", description: "Import CSV exported from HoneyBook", icon: "BookOpen", requiresFile: true, color: "from-pink-500 to-rose-500" },
  { id: "hubspot", name: "HubSpot CRM", description: "Sync pipeline from HubSpot dashboard", icon: "Compass", requiresFile: false, color: "from-orange-500 to-amber-500" },
  { id: "salesforce", name: "Salesforce", description: "Connect and fetch Salesforce object data", icon: "Shield", requiresFile: false, color: "from-sky-500 to-indigo-600" },
  { id: "zoho", name: "Zoho CRM", description: "Sync contacts and leads from Zoho CRM", icon: "Layers", requiresFile: false, color: "from-yellow-500 to-amber-500" },
  { id: "notion", name: "Notion Database", description: "Import from a shared Notion workspace", icon: "Sparkles", requiresFile: false, color: "from-zinc-600 to-zinc-900" },
];

export const DATA_TYPES: DataType[] = [
  {
    id: "leads",
    name: "CRM Leads",
    description: "Prospective customer inquiries, budgets, and lead sources",
    schemaFields: [
      { key: "name", label: "Client Name", type: "string", required: true },
      { key: "email", label: "Email Address", type: "email", required: true },
      { key: "phone", label: "Phone Number", type: "phone", required: false },
      { key: "eventType", label: "Event Type", type: "string", required: false },
      { key: "budget", label: "Estimated Budget", type: "number", required: false },
      { key: "eventDate", label: "Event Date", type: "date", required: false },
      { key: "notes", label: "Notes", type: "string", required: false },
    ],
  },
  {
    id: "events",
    name: "Events Planner",
    description: "Scheduled event details, venues, status columns, and coordinators",
    schemaFields: [
      { key: "name", label: "Event Name", type: "string", required: true },
      { key: "eventType", label: "Event Type", type: "string", required: true },
      { key: "venue", label: "Venue Name", type: "string", required: false },
      { key: "budget", label: "Total Budget", type: "number", required: false },
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "endDate", label: "End Date", type: "date", required: true },
      { key: "status", label: "Status Status", type: "string", required: false },
    ],
  },
  {
    id: "invoices",
    name: "Finance Invoices",
    description: "Outstanding invoices, billing records, taxes, and payment totals",
    schemaFields: [
      { key: "invoiceNumber", label: "Invoice Number", type: "string", required: true },
      { key: "clientName", label: "Client Name", type: "string", required: true },
      { key: "amount", label: "Invoice Amount", type: "number", required: true },
      { key: "taxAmount", label: "Tax Amount", type: "number", required: false },
      { key: "issueDate", label: "Issue Date", type: "date", required: true },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATASETS
// ═══════════════════════════════════════════════════════════════════════════════

export const DEMO_DATASETS: DemoDataset[] = [
  {
    id: "wedding-planner",
    name: "Wedding Planner Dataset",
    description: "Realistic template for wedding planners containing client contact leads, event dates, venues, and notes.",
    dataType: "leads",
    headers: ["Full Name", "Contact Email", "Phone", "Event Type", "Event Budget", "Date of Wedding", "Notes"],
    rows: [
      { "Full Name": "Aria Montgomery", "Contact Email": "aria.m@example.com", "Phone": "555-0192", "Event Type": "Wedding", "Event Budget": "45000", "Date of Wedding": "2026-10-18", "Notes": "Prefers botanical gardens venue" },
      { "Full Name": "David Miller", "Contact Email": "david.miller@gmail.com", "Phone": "+1 (555) 982-1244", "Event Type": "Wedding", "Event Budget": "65000", "Date of Wedding": "2026-12-05", "Notes": "Require indoor backup hall" },
      { "Full Name": "Elena Rostova", "Contact Email": "elena.r@corporate.org", "Phone": "333-2190-12", "Event Type": "Wedding", "Event Budget": "abc", "Date of Wedding": "15/08/2026", "Notes": "Requires custom catering" }, // budget is invalid number, date format warning
      { "Full Name": "Marcus Vance", "Contact Email": "", "Phone": "555-1200", "Event Type": "Wedding", "Event Budget": "30000", "Date of Wedding": "2026-09-22", "Notes": "Missing email validation error" }, // missing email error
      { "Full Name": "Sophia Loren", "Contact Email": "aria.m@example.com", "Phone": "555-0192", "Event Type": "Wedding", "Event Budget": "50000", "Date of Wedding": "2026-10-18", "Notes": "Duplicate Email Detection" }, // duplicate error
    ],
    suggestedMapping: {
      "Full Name": "name",
      "Contact Email": "email",
      "Phone": "phone",
      "Event Type": "eventType",
      "Event Budget": "budget",
      "Date of Wedding": "eventDate",
      "Notes": "notes",
    },
    validationReport: {
      totalRows: 5,
      errorCount: 2, // Row 4 (missing email), Row 5 (duplicate email)
      warningCount: 2, // Row 3 (budget not number, non-iso date format)
      duplicateCount: 1, // Row 5 email match
      issues: [
        { rowIdx: 2, colHeader: "Event Budget", type: "warning", message: "Value 'abc' is not a valid number. Defaulting to 0.", value: "abc" },
        { rowIdx: 2, colHeader: "Date of Wedding", type: "warning", message: "Date format '15/08/2026' is non-standard. Auto-converted to '2026-08-15'.", value: "15/08/2026" },
        { rowIdx: 3, colHeader: "Contact Email", type: "error", message: "Required field 'Email Address' is missing.", value: "" },
        { rowIdx: 4, colHeader: "Contact Email", type: "error", message: "Duplicate email 'aria.m@example.com' matches Row 1. Action: Skip / Merge.", value: "aria.m@example.com" },
      ],
    },
  },
  {
    id: "corporate-events",
    name: "Corporate Events Template",
    description: "Template optimized for annual galas, corporate seminars, venues, and multi-day conferences.",
    dataType: "events",
    headers: ["Conference Title", "Session Type", "Venue Location", "Expected Budget", "Start Date", "End Date", "Status"],
    rows: [
      { "Conference Title": "Global Tech Summit 2026", "Session Type": "Corporate", "Venue Location": "Convention Center", "Expected Budget": "150000", "Start Date": "2026-11-05", "End Date": "2026-11-07", "Status": "Planning" },
      { "Conference Title": "BioMed Leadership Dinner", "Session Type": "Corporate", "Venue Location": "Skyline Hotel", "Expected Budget": "25000", "Start Date": "2026-09-12", "End Date": "2026-09-12", "Status": "Confirmed" },
      { "Conference Title": "Fintech Retreat", "Session Type": "Corporate", "Venue Location": "Napa Valley Lodge", "Expected Budget": "90000", "Start Date": "2026-10-01", "End Date": "2026-09-28", "Status": "Planning" }, // start date after end date error
    ],
    suggestedMapping: {
      "Conference Title": "name",
      "Session Type": "eventType",
      "Venue Location": "venue",
      "Expected Budget": "budget",
      "Start Date": "startDate",
      "End Date": "endDate",
      "Status": "status",
    },
    validationReport: {
      totalRows: 3,
      errorCount: 1, // End Date before Start Date
      warningCount: 0,
      duplicateCount: 0,
      issues: [
        { rowIdx: 2, colHeader: "End Date", type: "error", message: "End Date ('2026-09-28') cannot be earlier than Start Date ('2026-10-01').", value: "2026-09-28" },
      ],
    },
  },
];
