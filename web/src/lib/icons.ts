/**
 * Centralized Icon Registry for EventOS.
 * All icons used in the application must be registered here to ensure visual consistency
 * and prevent raw icon strings in components.
 * 
 * We primarily use the 'lucide' set from Iconify.
 */
export const ICONS = {
  // Navigation & Core Modules
  dashboard: "lucide:layout-dashboard",
  calendar: "lucide:calendar",
  leads: "lucide:user-check",
  quotes: "lucide:file-text",
  invoices: "lucide:receipt",
  payments: "lucide:credit-card",
  settings: "lucide:settings",
  gallery: "lucide:image",
  portal: "lucide:monitor",

  // Actions
  plus: "lucide:plus",
  edit: "lucide:pencil",
  trash: "lucide:trash-2",
  close: "lucide:x",
  menu: "lucide:menu",
  search: "lucide:search",
  share: "lucide:share-2",
  link: "lucide:link",
  upload: "lucide:upload-cloud",
  download: "lucide:download",
  filter: "lucide:filter",
  copy: "lucide:copy",
  save: "lucide:save",

  // Statuses & Indicators
  check: "lucide:check",
  checkCircle: "lucide:check-circle-2",
  alertTriangle: "lucide:alert-triangle",
  alertCircle: "lucide:alert-circle",
  info: "lucide:info",
  clock: "lucide:clock",
  lock: "lucide:lock",
  unlock: "lucide:unlock",

  // Navigation Arrows & Chevrons
  arrowRight: "lucide:arrow-right",
  arrowLeft: "lucide:arrow-left",
  chevronRight: "lucide:chevron-right",
  chevronLeft: "lucide:chevron-left",
  chevronDown: "lucide:chevron-down",
  chevronUp: "lucide:chevron-up",

  // General Attributes
  user: "lucide:user",
  users: "lucide:users",
  email: "lucide:mail",
  phone: "lucide:phone",
  company: "lucide:building-2",
  currency: "lucide:indian-rupee",
  sun: "lucide:sun",
  moon: "lucide:moon",
  star: "lucide:star",
} as const;

export type IconName = keyof typeof ICONS;
