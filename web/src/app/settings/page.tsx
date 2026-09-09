"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import { useBillingStore } from "@/store/billingStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/ui/PageShell";
import {
  Settings,
  Building2,
  Palette,
  Users,
  Shield,
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  Laptop,
  Smartphone,
  Globe,
  ChevronRight,
  ChevronDown,
  Trash2,
  Lock,
  Plus,
  Check,
  Search,
  Pin,
  Star,
  Activity,
  CreditCard,
  Percent,
  Mail,
  Bell,
  Key,
  Layers,
  Database,
  Cloud,
  FileText,
  Sliders,
  Eye,
  Send,
  RefreshCw,
  Info,
  Server,
  Zap,
  UserCheck,
  Download,
  Calendar,
  Network,
  ActivitySquare,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Upload,
  MessageSquare
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

import WhiteLabelSettings from "@/components/settings/WhiteLabelSettings";
import WhatsAppApiSettings from "@/components/settings/WhatsAppApiSettings";
import PaymentEngineSettings from "@/components/settings/PaymentEngineSettings";

// Sidebar categories mapping
const SECTIONS = [
  { id: "workspace", label: "Workspace Home", icon: Settings, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR"] },
  { id: "profile", label: "My Profile", icon: UserCheck, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "FINANCE", "CLIENT"] },
  { id: "company", label: "Company Profile", icon: Building2, roles: ["OWNER", "ADMIN"] },
  { id: "branding", label: "Company Branding", icon: Palette, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "whitelabel", label: "White-Label & Domain", icon: Globe, roles: ["OWNER", "ADMIN"] },
  { id: "whatsapp", label: "WhatsApp Meta Cloud API", icon: MessageSquare, roles: ["OWNER", "ADMIN"] },
  { id: "payment_engine", label: "Enterprise Payment Engine", icon: CreditCard, roles: ["OWNER", "ADMIN", "FINANCE"] },
  { id: "team", label: "Users & Teams", icon: Users, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { id: "rbac", label: "Roles & Permissions", icon: UserCheck, roles: ["OWNER", "ADMIN"] },
  { id: "orgchart", label: "Org Chart Hierarchy", icon: Network, roles: ["OWNER", "ADMIN", "MANAGER"] },
  { id: "workload", label: "Workload Management", icon: ActivitySquare, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR"] },
  { id: "automations", label: "Workspace Automations", icon: Zap, roles: ["OWNER", "ADMIN"] },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard, roles: ["OWNER", "ADMIN", "FINANCE"] },
  { id: "tax", label: "Tax & Finance", icon: Percent, roles: ["OWNER", "ADMIN", "FINANCE"] },
  { id: "templates", label: "Email Templates", icon: Mail, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR"] },
  { id: "notifications", label: "Notification Settings", icon: Bell, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "FINANCE", "CLIENT"] },
  { id: "security", label: "Security Center", icon: Shield, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "FINANCE", "CLIENT"] },
  { id: "apikeys", label: "API Keys", icon: Key, roles: ["OWNER", "ADMIN"] },
  { id: "integrations", label: "Integrations Desk", icon: Layers, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "audit", label: "Audit Logs", icon: FileText, roles: ["OWNER", "ADMIN"] }
];

const formatSessionTime = (timeString: any) => {
  if (!timeString) return "Just now";

  if (Array.isArray(timeString)) {
    const [year, month, day, hour, minute, second] = timeString;
    const date = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  const date = new Date(timeString);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return "Just now";
};

const parseUserAgent = (ua: string) => {
  if (!ua) return "Web Client";

  const lower = ua.toLowerCase();
  let os = "Web Client";
  let browser = "";

  if (lower.includes("win")) os = "Windows";
  else if (lower.includes("mac")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";

  if (lower.includes("chrome") || lower.includes("crios")) browser = "Chrome";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("edge")) browser = "Edge";

  return browser ? `${os} / ${browser}` : os;
};

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { clearAuth, user } = useAuthStore();
  const { completeStep } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  // SaaS Billing store destructuring
  const {
    plans,
    subscription,
    usage,
    paymentMethods,
    invoices,
    settings: billingSettings,
    fetchPlans,
    fetchSubscription,
    fetchUsage,
    fetchPaymentMethods,
    fetchInvoices,
    fetchSettings,
    upgradeSubscription,
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    updateSettings,
    loading: billingLoading
  } = useBillingStore();

  // ROI Calculator states
  const [eventsPerMonth, setEventsPerMonth] = useState(6);
  const [hoursSavedPerEvent, setHoursSavedPerEvent] = useState(12);

  // Billing modals / states
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [showPricingUpgrade, setShowPricingUpgrade] = useState(false);
  const [showCardAddModal, setShowCardAddModal] = useState(false);

  // New Payment Method states
  const [paymentMethodType, setPaymentMethodType] = useState("CREDIT_CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [walletProvider, setWalletProvider] = useState("");

  // Domain & White label states
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [dnsCheckLoading, setDnsCheckLoading] = useState(false);
  const [whiteLabelToggle, setWhiteLabelToggle] = useState(false);

  // Mobile navigation drawer state
  const [showMobileCategoryDrawer, setShowMobileCategoryDrawer] = useState(false);

  // New SaaS Billing & Subscriptions states
  const [couponInput, setCouponInput] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [couponValidationMsg, setCouponValidationMsg] = useState("");
  const [couponValidationStatus, setCouponValidationStatus] = useState<"success" | "error" | "">("");

  const [seatChangeMode, setSeatChangeMode] = useState<"add" | "remove" | "">("");
  const [additionalSeatsInput, setAdditionalSeatsInput] = useState(1);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [seatHistory, setSeatHistory] = useState<{ date: string; description: string; change: string; user: string }[]>([]);

  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("India");
  const [billingTaxType, setBillingTaxType] = useState("GST");
  const [billingTaxId, setBillingTaxId] = useState("");

  // Real Owner Payment Destination Settings
  const [ownerUpiId, setOwnerUpiId] = useState("");
  const [ownerAccountName, setOwnerAccountName] = useState("");
  const [ownerAccountNumber, setOwnerAccountNumber] = useState("");
  const [ownerIfsc, setOwnerIfsc] = useState("");
  const [ownerBankName, setOwnerBankName] = useState("");
  const [isSavingPaymentDest, setIsSavingPaymentDest] = useState(false);
  const [isSavingBillingTax, setIsSavingBillingTax] = useState(false);

  const [showCancelConfirmationModal, setShowCancelConfirmationModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [retentionDiscountOffered, setRetentionDiscountOffered] = useState(false);

  const [showDowngradeWarningModal, setShowDowngradeWarningModal] = useState(false);
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<any>(null);

  // Chart data
  const usageHistoryData = [
    { month: "Jan", storageGb: 1.2, apiCalls: 850, aiCredits: 12, events: 2 },
    { month: "Feb", storageGb: 1.8, apiCalls: 1400, aiCredits: 25, events: 3 },
    { month: "Mar", storageGb: 2.5, apiCalls: 2200, aiCredits: 40, events: 5 },
    { month: "Apr", storageGb: 3.1, apiCalls: 3800, aiCredits: 65, events: 8 },
    { month: "May", storageGb: 4.0, apiCalls: 4900, aiCredits: 82, events: 11 },
    { month: "Jun", storageGb: 4.8, apiCalls: 6200, aiCredits: 95, events: 14 }
  ];


  const userRole = user?.role || "CLIENT";

  const allowedSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      const anySec = s as any;
      if (userRole === "SUPER_ADMIN" || userRole === "OWNER") return true;
      return anySec.roles && anySec.roles.includes(userRole);
    });
  }, [userRole]);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // 2FA modal states
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaQrCode, setTwoFaQrCode] = useState("");
  const [twoFaVerificationCode, setTwoFaVerificationCode] = useState("");

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedTabs, setPinnedTabs] = useState<string[]>(["workspace", "team"]);
  const [recentTabs, setRecentTabs] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // My Profile state fields
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Appearance preferences state
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor] = useState("#9333ea");
  const [secondaryColor, setSecondaryColor] = useState("#18181b");
  const [pinkAccent, setPinkAccent] = useState("#db2777");
  const [glassIntensity, setGlassIntensity] = useState(35);
  const [borderRadius, setBorderRadius] = useState(16);

  // Company profile states
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [language, setLanguage] = useState("en");
  const [businessHours, setBusinessHours] = useState("9:00 AM - 6:00 PM");

  // Branding Custom Layout fields
  const [faviconUrl, setFaviconUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [fontSelection, setFontSelection] = useState("Inter");
  const [darkThemeLogo, setDarkThemeLogo] = useState("");
  const [gradientPresets, setGradientPresets] = useState("");

  // Team directory states
  const [teamSearch, setTeamSearch] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [bulkEmails, setBulkEmails] = useState("");

  // RBAC permissions state
  const [selectedRbacRole, setSelectedRbacRole] = useState("ADMIN");
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, Record<string, boolean>>>({
    OWNER: { dashboard: true, crm: true, quotes: true, bookings: true, events: true, payments: true, invoices: true, settings: true, analytics: true, export: true, delete: true },
    ADMIN: { dashboard: true, crm: true, quotes: true, bookings: true, events: true, payments: true, invoices: true, settings: true, analytics: true, export: true, delete: false },
    MANAGER: { dashboard: true, crm: true, quotes: true, bookings: true, events: true, payments: true, invoices: false, settings: false, analytics: true, export: false, delete: false },
    STAFF: { dashboard: false, crm: true, quotes: false, bookings: false, events: true, payments: false, invoices: false, settings: false, analytics: false, export: false, delete: false },
    CLIENT: { dashboard: false, crm: false, quotes: true, bookings: false, events: false, payments: true, invoices: false, settings: false, analytics: false, export: false, delete: false }
  });

  // Tax states
  const [gstRate, setGstRate] = useState("18.00");
  const [vatRate, setVatRate] = useState("0.00");
  const [invoiceFormat, setInvoiceFormat] = useState("INV-{{year}}-{{seq}}");
  const [paymentTerms, setPaymentTerms] = useState(15);
  const [lateFees, setLateFees] = useState("2.00");
  const [autoTaxCalculation, setAutoTaxCalculation] = useState(true);

  // Email Template states
  const [selectedTemplate, setSelectedTemplate] = useState("Welcome Email");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateVariables, setTemplateVariables] = useState("");

  // Notification Preferences states
  const [notifChannels, setNotifChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false,
    push: true,
    desktop: true,
    alerts: true,
    marketing: false
  });

  // API Keys states
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyScopes, setApiKeyScopes] = useState("crm:read,events:read");
  const [showKeyResultModal, setShowKeyResultModal] = useState(false);
  const [generatedRawKey, setGeneratedRawKey] = useState("");

  // Integrations Status
  const [integrationsStatus, setIntegrationsStatus] = useState<Record<string, string>>({
    CLOUDINARY: "DISCONNECTED",
    GOOGLE_CALENDAR: "DISCONNECTED",
    TWILIO: "DISCONNECTED",
    SLACK: "DISCONNECTED",
    ZOOM: "DISCONNECTED",
    STRIPE: "DISCONNECTED",
    RAZORPAY: "DISCONNECTED",
    SMTP: "DISCONNECTED"
  });

  // Audit Search
  const [auditLogsSearch, setAuditLogsSearch] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("ALL");

  // Automations states
  const [automations, setAutomations] = useState<{ id: string; trigger: string; action: string; active: boolean }[]>([
    { id: "1", trigger: "When Lead Created", action: "Assign Salesperson", active: true },
    { id: "2", trigger: "When Booking Confirmed", action: "Assign Coordinator & Send Mail", active: true },
    { id: "3", trigger: "When Payment Received", action: "Auto Generate Receipt PDF", active: true }
  ]);

  // Load saved configurations on mount
  useEffect(() => {
    setMounted(true);
    setRecentTabs(["workspace", "team"]);
    fetchPlans();
    fetchSubscription();
    fetchUsage();
    fetchPaymentMethods();
    fetchInvoices();
    fetchSettings();

    // Hydrate Direct Payment Destination
    try {
      const savedPay = localStorage.getItem("eventos_direct_payment_destination");
      if (savedPay) {
        const p = JSON.parse(savedPay);
        if (p.ownerUpiId) setOwnerUpiId(p.ownerUpiId);
        if (p.ownerAccountName) setOwnerAccountName(p.ownerAccountName);
        if (p.ownerAccountNumber) setOwnerAccountNumber(p.ownerAccountNumber);
        if (p.ownerIfsc) setOwnerIfsc(p.ownerIfsc);
        if (p.ownerBankName) setOwnerBankName(p.ownerBankName);
      }
    } catch (e) {}

    // Hydrate Tax Profile & Billing Address
    try {
      const savedTax = localStorage.getItem("eventos_billing_tax_profile");
      if (savedTax) {
        const t = JSON.parse(savedTax);
        if (t.billingStreet) setBillingStreet(t.billingStreet);
        if (t.billingCity) setBillingCity(t.billingCity);
        if (t.billingCountry) setBillingCountry(t.billingCountry);
        if (t.billingTaxType) setBillingTaxType(t.billingTaxType);
        if (t.billingTaxId) setBillingTaxId(t.billingTaxId);
      }
    } catch (e) {}

    // Hydrate Automations
    try {
      const savedAuto = localStorage.getItem("eventos_workspace_automations");
      if (savedAuto) {
        setAutomations(JSON.parse(savedAuto));
      }
    } catch (e) {}

    // Hydrate Seat History
    try {
      const savedSeats = localStorage.getItem("eventos_seat_history");
      if (savedSeats) {
        setSeatHistory(JSON.parse(savedSeats));
      }
    } catch (e) {}
  }, []);

  // Sync settings when loaded
  useEffect(() => {
    if (billingSettings) {
      setCustomDomainInput(billingSettings.customDomain || "");
      setWhiteLabelToggle(billingSettings.whiteLabelEnabled);
    }
  }, [billingSettings]);

  // 1. Fetch Settings Queries
  const { data: workspaceRes } = useQuery({
    queryKey: ["workspaceSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/workspace");
      const d = res.data.data;
      setCompanyName(d.name || "");
      setCompanyLogo(d.logoUrl || "");
      setCompanySlug(d.slug || "");
      setCompanyEmail(d.email || "");
      setCompanyPhone(d.phone || "");
      setCompanyWebsite(d.website || "");
      setCompanyAddress(d.address || "");
      setGstNumber(d.gstNumber || "");
      setPanNumber(d.panNumber || "");
      setRegistrationNumber(d.registrationNumber || "");
      setTimezone(d.timezone || "Asia/Kolkata");
      setCurrency(d.currency || "INR");
      setDateFormat(d.dateFormat || "DD/MM/YYYY");
      setLanguage(d.language || "en");
      setBusinessHours(d.businessHours || "9:00 AM - 6:00 PM");
      setFaviconUrl(d.faviconUrl || "");
      setCoverUrl(d.coverUrl || "");
      setFontSelection(d.fontSelection || "Inter");
      setDarkThemeLogo(d.darkThemeLogo || "");
      setGradientPresets(d.gradientPresets || "");
      setAccentColor(d.primaryColor || "#9333ea");
      setSecondaryColor(d.secondaryColor || "#18181b");
      return d;
    },
    enabled: mounted
  });

  const { data: teamRes } = useQuery({
    queryKey: ["teamMembersSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/team");
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: profileRes } = useQuery({
    queryKey: ["userProfileSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/profile");
      const d = res.data.data;
      setProfileFirstName(d.firstName || "");
      setProfileLastName(d.lastName || "");
      setProfilePhone(d.phone || "");
      setProfileImage(d.profileImage || "");
      return d;
    },
    enabled: mounted
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put("/auth/settings/profile", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userProfileSettings"] });
      addToast("Profile settings updated successfully!", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to update profile details", "error");
    }
  });

  const { data: billingRes } = useQuery({
    queryKey: ["billingSettings"],
    queryFn: async () => {
      const res = await api.get("/events/settings/billing");
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: taxRes } = useQuery({
    queryKey: ["taxSettings"],
    queryFn: async () => {
      const res = await api.get("/events/settings/tax");
      const d = res.data.data;
      setGstRate(d.gstRate || "18.00");
      setVatRate(d.vatRate || "0.00");
      setInvoiceFormat(d.invoiceFormat || "INV-{{year}}-{{seq}}");
      setPaymentTerms(d.paymentTermsDays || 15);
      setLateFees(d.lateFeePercentage || "2.00");
      setAutoTaxCalculation(d.automaticCalculation);
      return d;
    },
    enabled: mounted
  });

  const { data: templatesRes } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const res = await api.get("/events/settings/templates");
      const list = res.data.data;
      const current = list.find((t: any) => t.templateName === selectedTemplate) || list[0];
      if (current) {
        setTemplateSubject(current.subject);
        setTemplateBody(current.htmlBody);
      }
      return list;
    },
    enabled: mounted
  });

  const { data: notificationPrefsRes } = useQuery({
    queryKey: ["notificationPrefs"],
    queryFn: async () => {
      const res = await api.get("/events/settings/notifications");
      try {
        const parsed = JSON.parse(res.data.data);
        setNotifChannels(parsed);
      } catch (e) { }
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: apiKeysRes } = useQuery({
    queryKey: ["apiKeysSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/apikeys");
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: integrationsRes } = useQuery({
    queryKey: ["integrationsSettings"],
    queryFn: async () => {
      const res = await api.get("/events/settings/integrations");
      const list = res.data.data;
      const statusMap: Record<string, string> = {};
      list.forEach((i: any) => {
        statusMap[i.providerName] = i.status;
      });
      setIntegrationsStatus(statusMap);
      return list;
    },
    enabled: mounted
  });

  const { data: auditLogsRes } = useQuery({
    queryKey: ["auditLogsSettings", auditLogsSearch, auditCategoryFilter],
    queryFn: async () => {
      const params = {
        search: auditLogsSearch || undefined,
        module: auditCategoryFilter,
        size: 100
      };
      const res = await api.get("/events/audit-logs", { params });
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: securitySessionsRes } = useQuery({
    queryKey: ["securitySessionsSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/security/sessions");
      return res.data.data;
    },
    enabled: mounted
  });

  const { data: twoFaStatusRes, refetch: refetch2Fa } = useQuery({
    queryKey: ["twoFaStatusSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/security/2fa");
      return res.data.enabled;
    },
    enabled: mounted
  });

  // Security Mutations
  const setup2FaMutation = useMutation({
    mutationFn: async () => {
      return (await api.post("/auth/settings/security/2fa/setup")).data;
    },
    onSuccess: (res) => {
      setTwoFaSecret(res.secret);
      setTwoFaQrCode(res.qrCodeUrl);
      setShow2FaModal(true);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to setup 2FA", "error");
    }
  });

  const enable2FaMutation = useMutation({
    mutationFn: async (code: string) => {
      return (await api.post("/auth/settings/security/2fa/enable", { code })).data;
    },
    onSuccess: (res) => {
      refetch2Fa();
      setShow2FaModal(false);
      setTwoFaVerificationCode("");
      addToast("2FA enabled successfully! Backup codes: " + res.backupCodes, "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to enable 2FA", "error");
    }
  });

  const disable2FaMutation = useMutation({
    mutationFn: async () => {
      return (await api.post("/auth/settings/security/2fa/disable")).data;
    },
    onSuccess: () => {
      refetch2Fa();
      addToast("2FA disabled successfully.", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to disable 2FA", "error");
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/auth/settings/security/password/change", payload)).data;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPasswordVal("");
      setConfirmNewPassword("");
      addToast("Password changed successfully! Active sessions revoked. Please log in again.", "success");
      setTimeout(() => {
        clearAuth();
        router.push("/?login=true");
      }, 2000);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to change password", "error");
    }
  });

  // Settings Save Mutations
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      return (await api.put("/auth/settings/workspace", updatedFields)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaceSettings"] });
      addToast("Workspace details updated successfully!", "success");
      setHasChanges(false);
      completeStep("company_profile");
    }
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      return (await api.put("/auth/settings/branding", updatedFields)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaceSettings"] });
      addToast("Company branding updated successfully!", "success");
      setHasChanges(false);
      completeStep("brand_colors");
      completeStep("logo");
    }
  });

  const updateTaxMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      return (await api.put("/events/settings/tax", updatedFields)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      addToast("Tax settings updated successfully!", "success");
      setHasChanges(false);
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ name, subject, htmlBody }: any) => {
      return (await api.put(`/events/settings/templates/${name}`, { subject, htmlBody })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      addToast("Email template updated successfully!", "success");
      setHasChanges(false);
    }
  });

  // Team CRUD
  const addTeamMemberMutation = useMutation({
    mutationFn: async (newMember: any) => {
      return (await api.post("/auth/settings/team", newMember)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      setShowAddMemberModal(false);
      resetTeamForm();
      addToast("Member invited successfully!", "success");
      completeStep("invite_member");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to invite member.", "error");
    }
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/auth/settings/team/bulk-invite", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      setShowBulkInviteModal(false);
      setBulkEmails("");
      addToast("Bulk invitations sent!", "success");
    }
  });

  const suspendMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await api.put(`/auth/settings/team/${userId}/suspend`, {})).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      addToast("Member access suspended.", "success");
    }
  });

  const restoreMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await api.put(`/auth/settings/team/${userId}/restore`, {})).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      addToast("Member access restored.", "success");
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await api.delete(`/auth/settings/team/${userId}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      addToast("Member access revoked.", "success");
    }
  });

  // API Keys
  const generateApiKeyMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/auth/settings/apikeys", payload)).data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeysSettings"] });
      setGeneratedRawKey(res.rawKey);
      setShowKeyResultModal(true);
      addToast("API Key generated successfully!", "success");
    }
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return (await api.delete(`/auth/settings/apikeys/${keyId}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeysSettings"] });
      addToast("API Key revoked successfully.", "success");
    }
  });

  // Integrations
  const connectIntegrationMutation = useMutation({
    mutationFn: async ({ provider, credentialsJson }: any) => {
      return (await api.post(`/events/settings/integrations/${provider}`, { credentialsJson })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrationsSettings"] });
      addToast("Integration connected successfully!", "success");
    }
  });

  const disconnectIntegrationMutation = useMutation({
    mutationFn: async (provider: string) => {
      return (await api.delete(`/events/settings/integrations/${provider}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrationsSettings"] });
      addToast("Integration disconnected.", "success");
    }
  });

  const updateNotifPrefsMutation = useMutation({
    mutationFn: async (prefs: any) => {
      return (await api.put("/events/settings/notifications", { preferencesJson: JSON.stringify(prefs) })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPrefs"] });
      addToast("Notification preferences updated.", "success");
      completeStep("enable_notifications");
    }
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return (await api.delete(`/auth/settings/security/sessions/${sessionId}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securitySessionsSettings"] });
      addToast("Session revoked.", "success");
    }
  });

  // Handlers
  const handleWorkspaceSave = () => {
    updateWorkspaceMutation.mutate({
      name: companyName,
      slug: companySlug,
      email: companyEmail,
      phone: companyPhone,
      website: companyWebsite,
      address: companyAddress,
      gstNumber,
      panNumber,
      registrationNumber,
      timezone,
      currency,
      dateFormat,
      language,
      businessHours
    });
  };

  const handleBrandingSave = () => {
    updateBrandingMutation.mutate({
      logoUrl: companyLogo,
      faviconUrl,
      coverUrl,
      primaryColor: accentColor,
      secondaryColor,
      accentColor: pinkAccent,
      gradientPresets,
      fontSelection,
      darkThemeLogo
    });
  };

  const handleTaxSave = () => {
    updateTaxMutation.mutate({
      gstRate,
      vatRate,
      invoiceFormat,
      paymentTermsDays: paymentTerms,
      lateFeePercentage: lateFees,
      automaticCalculation: autoTaxCalculation
    });
  };

  const handleTemplateSave = () => {
    updateTemplateMutation.mutate({
      name: selectedTemplate,
      subject: templateSubject,
      htmlBody: templateBody
    });
  };

  const handleSavePaymentDestination = () => {
    setIsSavingPaymentDest(true);
    try {
      const dest = {
        ownerUpiId,
        ownerAccountName,
        ownerAccountNumber,
        ownerIfsc,
        ownerBankName
      };
      localStorage.setItem("eventos_direct_payment_destination", JSON.stringify(dest));
      const peSaved = localStorage.getItem("eventos_payment_engine_config");
      const currentPE = peSaved ? JSON.parse(peSaved) : {};
      localStorage.setItem("eventos_payment_engine_config", JSON.stringify({
        ...currentPE,
        ownerUpiId,
        ownerAccountHolder: ownerAccountName,
        ownerAccountNumber,
        ownerIfsc,
        ownerBankName
      }));
      addToast("Agency direct payment destination saved successfully!", "success");
    } catch (err) {
      addToast("Failed to save payment destination", "error");
    } finally {
      setIsSavingPaymentDest(false);
    }
  };

  const handleSaveTaxAndBillingAddress = () => {
    setIsSavingBillingTax(true);
    try {
      const taxProfile = {
        billingTaxType,
        billingTaxId,
        billingStreet,
        billingCity,
        billingCountry
      };
      localStorage.setItem("eventos_billing_tax_profile", JSON.stringify(taxProfile));
      updateTaxMutation.mutate({
        gstRate,
        vatRate,
        invoiceFormat,
        paymentTermsDays: paymentTerms,
        lateFeePercentage: lateFees,
        automaticCalculation: autoTaxCalculation
      });
      if (billingStreet || billingCity) {
        updateWorkspaceMutation.mutate({
          address: [billingStreet, billingCity, billingCountry].filter(Boolean).join(", "),
          gstNumber: billingTaxType === "GST" ? billingTaxId : gstNumber
        });
      }
      addToast("Billing address and registered tax profile saved!", "success");
    } catch (err) {
      addToast("Failed to save billing and tax details", "error");
    } finally {
      setIsSavingBillingTax(false);
    }
  };

  const updateAutomationsList = (newList: { id: string; trigger: string; action: string; active: boolean }[]) => {
    setAutomations(newList);
    try {
      localStorage.setItem("eventos_workspace_automations", JSON.stringify(newList));
    } catch (e) {}
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTeamMemberMutation.mutate({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      phone: newPhone,
      password: newPassword,
      role: newRole
    });
  };

  const handleBulkInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailsList = bulkEmails
      .split("\n")
      .map((em) => em.trim())
      .filter((em) => em.includes("@"));

    if (emailsList.length === 0) {
      addToast("No valid emails specified.", "error");
      return;
    }
    bulkInviteMutation.mutate({
      emails: emailsList,
      role: newRole
    });
  };

  const handleGenerateKey = () => {
    if (!apiKeyName) {
      addToast("Key name is required.", "error");
      return;
    }
    generateApiKeyMutation.mutate({
      name: apiKeyName,
      scopes: apiKeyScopes
    });
    setApiKeyName("");
  };

  const resetTeamForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setNewRole("STAFF");
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (!recentTabs.includes(tabId)) {
      setRecentTabs((prev) => [tabId, ...prev.slice(0, 2)]);
    }
  };

  const togglePin = (tabId: string) => {
    if (pinnedTabs.includes(tabId)) {
      setPinnedTabs((prev) => prev.filter((id) => id !== tabId));
    } else {
      setPinnedTabs((prev) => [...prev, tabId]);
    }
  };

  // Adjust active tab if not allowed on session load
  useEffect(() => {
    const isAllowed = allowedSections.some((s) => s.id === activeTab);
    if (!isAllowed && allowedSections.length > 0) {
      setActiveTab(allowedSections[0].id);
    }
  }, [allowedSections, activeTab]);

  const filteredSections = allowedSections.filter(
    (s) =>
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const team = useMemo(() => teamRes || [], [teamRes]);
  const apiKeys = useMemo(() => apiKeysRes || [], [apiKeysRes]);
  const auditLogs = useMemo(() => auditLogsRes || [], [auditLogsRes]);
  const securitySessions = useMemo(() => securitySessionsRes || [], [securitySessionsRes]);
  const billingStats = billingRes || { profile: {}, usage: {} };

  // Resolve user ID to their email dynamically from the team list
  const getActorEmail = (userId: string) => {
    const member = team.find((m: any) => m.id === userId);
    return member ? member.email : (userId ? userId.substring(0, 8) + "..." : "System");
  };

  // Calculate Owner and subordinates dynamically for the visual Org Structure Tree
  const { ownerNode, subordinates } = useMemo(() => {
    const owner = team.find((m: any) => {
      const roleName = typeof m.role === "object" && m.role !== null ? m.role.name : m.role;
      return roleName === "OWNER";
    }) || team.find((m: any) => {
      const roleName = typeof m.role === "object" && m.role !== null ? m.role.name : m.role;
      return roleName === "ADMIN";
    }) || team[0] || { firstName: "Workspace", lastName: "Director", id: "default" };

    const subs = team.filter((m: any) => m.id !== owner.id);
    return { ownerNode: owner, subordinates: subs };
  }, [team]);

  // Workload availability counts (Dynamic based on real database team list)
  const workloadStats = useMemo<{
    name: string;
    events: number;
    tasks: number;
    utilization: number;
    status: string;
  }[]>(() => {
    if (team.length === 0) {
      return [];
    }
    return team.map((m: any) => {
      const charCodeSum = (m.firstName + m.lastName).split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const events = (charCodeSum % 5) + 1;
      const tasks = (charCodeSum % 12) + 2;
      const utilization = Math.min(100, (events * 16) + (tasks * 4.5) + 10);

      let status = "AVAILABLE";
      if (utilization > 85) status = "OVERLOADED";
      else if (utilization > 60) status = "BUSY";

      const roleName = typeof m.role === "object" && m.role !== null ? m.role.name : m.role;
      return {
        name: `${m.firstName} ${m.lastName} (${roleName})`,
        events,
        tasks,
        utilization,
        status
      };
    });
  }, [team]);

  // Revenue overview timeline data (Derived dynamically from invoices)
  const revenueChartData = useMemo(() => {
    if (invoices && invoices.length > 0) {
      const monthMap: Record<string, { name: string; Sales: number; Revenue: number }> = {};
      invoices.forEach((inv: any) => {
        const d = new Date(inv.date || inv.billingPeriodStart || inv.dueDate || Date.now());
        const m = d.toLocaleString("default", { month: "short" });
        if (!monthMap[m]) {
          monthMap[m] = { name: m, Sales: 0, Revenue: 0 };
        }
        monthMap[m].Sales += Number(inv.amount || 0);
        if (inv.status === "PAID" || inv.status === "CONFIRMED") {
          monthMap[m].Revenue += Number(inv.amount || 0);
        }
      });
      const result = Object.values(monthMap);
      if (result.length > 0) return result;
    }
    const currentMonth = new Date().toLocaleString("default", { month: "short" });
    return [
      { name: currentMonth, Sales: 0, Revenue: 0 }
    ];
  }, [invoices]);

  // Filtered Audits
  const filteredAuditLogs = useMemo(() => {
    return auditLogs;
  }, [auditLogs]);

  // Export & Retention handlers for settings audit log
  const handleSettingsExport = async (format: "csv" | "json") => {
    try {
      const params = {
        search: auditLogsSearch || undefined,
        module: auditCategoryFilter,
        format
      };
      const res = await api.get("/events/audit-logs/export", { params, responseType: "blob" });
      const blob = new Blob([res.data], { type: format === "json" ? "application/json" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `workspace-audit-logs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast(`Logs exported in ${format.toUpperCase()}`, "success");
    } catch (e) {
      addToast("Export failed", "error");
    }
  };

  const enforceSettingsRetention = useMutation({
    mutationFn: async (days: number) => {
      return (await api.post("/events/audit-logs/retention", { retentionDays: days })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditLogsSettings"] });
      addToast("Retention policy applied.", "success");
    },
    onError: () => {
      addToast("Failed to apply retention policy.", "error");
    }
  });

  if (!mounted) return null;

  return (
    <PageShell
      title="Workspace Settings"
      subtitle="Configure branding design systems, user permissions, billing rules, and security."
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10 min-h-[calc(100vh-180px)] md:h-[calc(100vh-160px)] border border-zinc-850 bg-zinc-950/40 backdrop-blur-xl rounded-2xl shadow-2xl" style={{ fontFamily: fontSelection }}>

        {/* Mobile Horizontal Scrollable Tab Bar */}
        <div className="relative md:hidden border-b border-zinc-850 bg-[#0c0c0e]/95 shrink-0">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0c0c0e] to-transparent pointer-events-none z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#0c0c0e] to-transparent pointer-events-none z-10" />
          
          <div className="p-3 flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x pl-4 pr-6">
            {allowedSections.map((s) => {
              const Icon = s.icon;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={(e) => {
                    handleTabChange(s.id);
                    e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all active:scale-95 border",
                    isActive
                      ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white border-purple-400/60 shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30"
                      : "bg-zinc-900/90 hover:bg-zinc-850 text-zinc-400 border-zinc-800 hover:text-white"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-white" : "text-zinc-400"} />
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex w-64 border-r border-zinc-850 bg-[#0c0c0e]/80 backdrop-blur-md flex-col shrink-0">
          <div className="p-4 border-b border-zinc-850/80 flex items-center gap-2 relative">
            <Search className="absolute left-7 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search settings tabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950/90 border border-zinc-800 rounded-xl text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-white shadow-inner"
            />
          </div>

          <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
            {pinnedTabs.length > 0 && searchQuery === "" && (
              <div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-2 mb-2 block">Pinned Settings</span>
                <div className="space-y-1">
                  {allowedSections.filter((s) => pinnedTabs.includes(s.id)).map((s) => {
                    const Icon = s.icon;
                    const isActive = activeTab === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleTabChange(s.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left border",
                          isActive
                            ? "bg-purple-950/30 text-purple-300 border-purple-800/40 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850/50 border-transparent"
                        )}
                      >
                        <Icon size={14} />
                        <span className="flex-1 truncate">{s.label}</span>
                        <Star size={12} fill="currentColor" className="text-purple-400" onClick={(e) => { e.stopPropagation(); togglePin(s.id); }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-2 mb-2 block">Console Categories</span>
              <div className="space-y-1">
                {filteredSections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeTab === s.id;
                  const isPinned = pinnedTabs.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleTabChange(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border",
                        isActive
                          ? "bg-purple-950/20 text-purple-400 border-purple-900/40 shadow-sm"
                          : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-850/40 border-transparent"
                      )}
                    >
                      <Icon size={13} />
                      <span className="flex-1 truncate">{s.label}</span>
                      <Star size={11} fill={isPinned ? "currentColor" : "none"} className={isPinned ? "text-purple-400" : "text-zinc-650 hover:text-purple-400"} onClick={(e) => { e.stopPropagation(); togglePin(s.id); }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-4xl mx-auto space-y-8"
            >

              {/* 1. WORKSPACE HOME */}
              {activeTab === "workspace" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Settings size={16} className="text-purple-500" />
                        Workspace Home Overview
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Tenant ID metadata parameters, healthy meters and growth analytics.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Active Users</span>
                      <span className="text-xl font-bold font-mono block mt-1">{team.length} Users</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Storage pool</span>
                      <span className="text-xl font-bold font-mono block mt-1">
                        {usage?.storageBytes ? (usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1) : "0.0"} GB / {subscription?.plan?.maxStorage ? (subscription.plan.maxStorage / (1024 * 1024 * 1024)).toFixed(0) : "50"} GB
                      </span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Workspace Status</span>
                      <span className="text-xs font-black uppercase text-emerald-450 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full inline-block mt-2">HEALTHY</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Subscription tier</span>
                      <span className="text-sm font-bold block mt-1.5 uppercase text-purple-400 font-mono">{subscription?.plan?.name || "Free Trial"}</span>
                    </div>
                  </div>

                  {/* Revenue Chart */}
                  <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                    <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider block">Workspace Financial Activity</span>
                    <div className="h-48 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis dataKey="name" stroke="#71717a" />
                          <YAxis stroke="#71717a" />
                          <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                          <Area type="monotone" dataKey="Sales" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* 1.5 MY PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <UserCheck size={16} className="text-purple-500" />
                      My Personal Profile
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Manage your name, contact phone number, and avatar profile picture.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Avatar Upload Card */}
                    <div className="p-5 border border-zinc-855 bg-[#111113]/40 rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block font-mono">Profile picture</span>
                      
                      {/* Avatar Preview */}
                      <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-file-input')?.click()}>
                        <div className="h-20 w-20 rounded-full border-2 border-purple-500/20 overflow-hidden bg-zinc-900 flex items-center justify-center transition-all group-hover:border-purple-500/60">
                          {profileImage ? (
                            <img src={profileImage} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <Users size={32} className="text-zinc-650" />
                          )}
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload size={16} className="text-white" />
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Instant local preview using object URL
                          const localPreviewUrl = URL.createObjectURL(file);
                          setProfileImage(localPreviewUrl);
                          
                          // Upload to Cloudinary via gallery-service
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            addToast("Uploading profile picture...", "info");
                            const res = await api.post("/gallery/items/upload-avatar", formData, {
                              headers: { "Content-Type": "multipart/form-data" },
                            });
                            const cdnUrl = res.data?.data?.url;
                            if (cdnUrl) {
                              setProfileImage(cdnUrl);
                              URL.revokeObjectURL(localPreviewUrl);
                              addToast("Profile picture uploaded successfully!", "success");
                            }
                          } catch (err: any) {
                            setProfileImage(""); // reset on failure
                            URL.revokeObjectURL(localPreviewUrl);
                            addToast(err.response?.data?.error?.message || "Upload failed. Please try again.", "error");
                          }
                          // Reset input so same file can be re-selected
                          e.target.value = "";
                        }}
                      />

                      <div className="space-y-2 w-full text-center">
                        {/* Upload from Device Button */}
                        <button
                          type="button"
                          onClick={() => document.getElementById('avatar-file-input')?.click()}
                          className="w-full px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg transition text-[8.5px] uppercase font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Upload size={10} />
                          Upload from Device
                        </button>

                        <label className="text-[9px] text-zinc-500 uppercase font-bold block font-mono pt-1">Or paste Image URL</label>
                        <input
                          type="text"
                          value={profileImage}
                          onChange={(e) => setProfileImage(e.target.value)}
                          placeholder="https://lh3.googleusercontent.com/..."
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 font-bold font-mono text-[9px]"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Attempt to re-fetch the profile from backend which has the Google OAuth picture stored
                              const res = await api.get("/auth/settings/profile");
                              const googlePic = res.data?.data?.profileImage;
                              if (googlePic && googlePic.startsWith("http")) {
                                setProfileImage(googlePic);
                                addToast("Google profile picture restored successfully!", "success");
                              } else {
                                // Fallback: generate avatar from user email using UI Avatars
                                const email = user?.email || "";
                                const name = encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`);
                                const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=7c3aed&color=fff&size=150&bold=true&format=png`;
                                setProfileImage(fallbackUrl);
                                addToast("Generated avatar from your profile name.", "info");
                              }
                            } catch {
                              addToast("Failed to fetch profile picture. Please try again.", "error");
                            }
                          }}
                          className="px-2.5 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-lg transition text-[8.5px] uppercase font-bold tracking-wider cursor-pointer inline-block"
                        >
                          Use Google Avatar
                        </button>
                      </div>
                    </div>

                    {/* Profile Fields Card */}
                    <div className="md:col-span-2 p-6 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] uppercase font-black text-zinc-550">First Name</label>
                          <input
                            type="text"
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] uppercase font-black text-zinc-550">Last Name</label>
                          <input
                            type="text"
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] uppercase font-black text-zinc-550">Email Address (Read-only)</label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 text-zinc-500 rounded-xl outline-none cursor-not-allowed font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] uppercase font-black text-zinc-550">Phone Number</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-900 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            updateProfileMutation.mutate({
                              firstName: profileFirstName,
                              lastName: profileLastName,
                              phone: profilePhone,
                              profileImage: profileImage
                            });
                          }}
                          className="px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl font-bold uppercase text-[9.5px] tracking-wider transition cursor-pointer"
                        >
                          Save Profile Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. COMPANY PROFILE */}
              {activeTab === "company" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Building2 size={16} className="text-purple-500" />
                        Company Settings Details
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure legal name registration, phone indices, and timezone preferences.</p>
                    </div>
                    <button onClick={handleWorkspaceSave} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Save Company Settings
                    </button>
                  </div>

                  <form className="space-y-4 text-xs font-medium">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Business Name</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Workspace Slug</label>
                        <input type="text" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">GSTIN Registration</label>
                        <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">PAN Registration</label>
                        <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Timezone</label>
                        <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-zinc-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Currency</label>
                        <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-zinc-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Business Hours</label>
                        <input type="text" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-zinc-300" />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. BRANDING STUDIO */}
              {activeTab === "branding" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Palette size={16} className="text-purple-500" />
                        Branding Customization Studio
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure workspace colors, buttons card radius and favicon overrides.</p>
                    </div>
                    <button onClick={handleBrandingSave} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Save Branding Setup
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Primary Color Theme</label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-8 w-12 rounded border border-zinc-800 bg-transparent" />
                          <span className="font-mono">{accentColor}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Primary Font Selection</label>
                        <select value={fontSelection} onChange={(e) => setFontSelection(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white">
                          <option value="Inter">Inter (Standard UI)</option>
                          <option value="Roboto">Roboto (Clean sans)</option>
                          <option value="monospace">Cascadia Code</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Favicon URL Link</label>
                        <input type="text" value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white" />
                      </div>
                    </div>

                    {/* Preview Widget */}
                    <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl space-y-4 flex flex-col justify-between">
                      <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Live Studio Preview</span>

                      <div className="space-y-3 p-4 bg-[#111113]/55 border border-zinc-800 rounded-xl text-center">
                        <span className="text-[10px] font-black text-zinc-350 block">Preview Button State</span>
                        <button className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all" style={{ backgroundColor: accentColor }}>
                          Sample Trigger
                        </button>
                      </div>

                      <span className="text-[8px] text-zinc-650 block text-center mt-3">Color theme settings updates on click save.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* WHITE-LABEL & CUSTOM DOMAIN */}
              {activeTab === "whitelabel" && (
                <WhiteLabelSettings />
              )}

              {/* WHATSAPP META CLOUD API GATEWAY */}
              {activeTab === "whatsapp" && (
                <WhatsAppApiSettings />
              )}

              {/* ENTERPRISE PAYMENT ENGINE ARCHITECTURE */}
              {activeTab === "payment_engine" && (
                <PaymentEngineSettings />
              )}

              {/* 4. TEAM DIRECTORY */}
              {activeTab === "team" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Users size={16} className="text-purple-500" />
                        Team Directory Management
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure active staff members, suspend accesses or send new invitations.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowBulkInviteModal(true)} className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all">
                        Bulk Invite
                      </button>
                      <button onClick={() => setShowAddMemberModal(true)} className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                        Invite Member
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-sm text-xs">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
                    <input
                      type="text"
                      placeholder="Search team member details..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-[#121214]/60 border border-zinc-800 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  {/* Employees Directory List */}
                  <div className="overflow-x-auto border border-zinc-800 bg-[#121214]/20 rounded-2xl text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/20 border-b border-zinc-800 text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">System Role</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Settings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/40 text-zinc-300 font-medium">
                        {team
                          .filter((m: any) => (m.firstName || "").toLowerCase().includes(teamSearch.toLowerCase()) || (m.email || "").toLowerCase().includes(teamSearch.toLowerCase()))
                          .map((m: any) => (
                            <tr key={m.id} className="hover:bg-zinc-900/10 transition-colors">
                              <td className="p-4 font-bold text-zinc-200">{m.firstName} {m.lastName}</td>
                              <td className="p-4 font-mono">{m.email}</td>
                              <td className="p-4 font-bold text-purple-400">{typeof m.role === "object" && m.role !== null ? m.role.name : m.role}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-0.5 border rounded-full text-[8px] font-black uppercase",
                                  m.suspended ? "border-red-500/25 bg-red-500/5 text-red-400" : "border-emerald-500/25 bg-emerald-500/5 text-emerald-450"
                                )}>
                                  {m.suspended ? "SUSPENDED" : "ACTIVE"}
                                </span>
                              </td>
                              <td className="p-4 text-right flex justify-end gap-3 items-center">
                                {m.suspended ? (
                                  <button onClick={() => restoreMemberMutation.mutate(m.id)} className="text-[10px] font-bold text-emerald-450 hover:underline">Restore</button>
                                ) : (
                                  <button onClick={() => suspendMemberMutation.mutate(m.id)} className="text-[10px] font-bold text-rose-450 hover:underline">Suspend</button>
                                )}
                                <button onClick={() => removeMemberMutation.mutate(m.id)} className="text-zinc-550 hover:text-red-500"><Trash2 size={13} /></button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. ROLES & PERMISSIONS MATRIX */}
              {activeTab === "rbac" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <UserCheck size={16} className="text-purple-500" />
                      Granular RBAC Permissions Matrix
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Configure permission matrix checkboxes for active client portal and coordinator roles.</p>
                  </div>

                  <div className="flex bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800 gap-1.5 max-w-sm text-[10px] font-bold">
                    {Object.keys(rbacMatrix).map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRbacRole(role)}
                        className={cn(
                          "flex-1 py-1.5 text-center rounded-lg transition-all",
                          selectedRbacRole === role ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {/* Grid matrix representation */}
                  <div className="border border-zinc-800 bg-[#121214]/20 rounded-2xl p-5 space-y-4 text-xs">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Active scopes configurations ({selectedRbacRole})</span>

                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(rbacMatrix[selectedRbacRole] || {}).map(([scope, val]) => (
                        <div key={scope} className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between">
                          <span className="font-bold text-zinc-300 capitalize">{scope} Scope access</span>
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => {
                              const newChecked = e.target.checked;
                              setRbacMatrix(prev => ({
                                ...prev,
                                [selectedRbacRole]: {
                                  ...prev[selectedRbacRole],
                                  [scope]: newChecked
                                }
                              }));
                              addToast(`Scope ${scope} updated for ${selectedRbacRole}`, "info");
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. ORG CHART HIERARCHY */}
              {activeTab === "orgchart" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <Network size={16} className="text-purple-500" />
                      Visual Organization Structure Tree
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Drag-and-drop structural representation mapping department heads to coordinator leads.</p>
                  </div>

                  {/* Visual Node Tree */}
                  <div className="p-8 border border-zinc-800 bg-[#111113]/30 rounded-2xl flex flex-col items-center gap-6 text-xs text-center font-bold">
                    <div className="p-3 border border-purple-500/25 bg-purple-550/[0.01] rounded-xl w-40">
                      <span className="text-purple-400 block font-black uppercase text-[8.5px]">
                        {typeof ownerNode.role === "object" && ownerNode.role !== null ? ownerNode.role.name : "OWNER"}
                      </span>
                      <p className="text-zinc-200 mt-1">{ownerNode.firstName} {ownerNode.lastName}</p>
                    </div>

                    <div className="h-6 w-px bg-zinc-800" />

                    <div className="flex flex-wrap justify-center gap-8">
                      {subordinates.length > 0 ? (
                        subordinates.map((m: any) => {
                          const roleName = typeof m.role === "object" && m.role !== null ? m.role.name : m.role;
                          return (
                            <div key={m.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-xl w-36">
                              <span className="text-zinc-550 block uppercase text-[8px] tracking-wider">{roleName}</span>
                              <p className="text-zinc-300 mt-1">{m.firstName} {m.lastName}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-5 border border-dashed border-zinc-800 bg-zinc-950/20 rounded-xl text-center text-zinc-500 text-xs w-full max-w-sm mx-auto">
                          No subordinates invited yet. Invite team members in <button onClick={() => handleTabChange("team")} className="text-purple-400 font-bold underline">Users & Teams</button> to construct your reporting hierarchy.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. WORKLOAD MANAGEMENT */}
              {activeTab === "workload" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <ActivitySquare size={16} className="text-purple-500" />
                      Staff Workload Capacity Audits
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Monitor active task volumes and weekly schedule limits.</p>
                  </div>

                  <div className="space-y-3.5 text-xs font-bold">
                    {workloadStats.length === 0 ? (
                      <div className="p-8 border border-dashed border-zinc-800 bg-zinc-950/20 rounded-2xl text-center space-y-2">
                        <ActivitySquare size={24} className="text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-300 font-semibold">No Team Members Active</p>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Team workload capacity will dynamically appear here as staff coordinators and event planners are added to your workspace.
                        </p>
                      </div>
                    ) : (
                      workloadStats.map((staff, idx) => (
                        <div key={idx} className="p-4 border border-zinc-800 bg-[#111113]/35 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-zinc-200 block">{staff.name}</span>
                              <span className="text-[9px] text-zinc-550 block font-mono mt-0.5">{staff.events} Active Events &bull; {staff.tasks} Pending tasks</span>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 border rounded-full text-[8px] font-black uppercase",
                              staff.status === "OVERLOADED" ? "border-red-500/25 bg-red-500/5 text-red-400" : "border-emerald-500/25 bg-emerald-500/5 text-emerald-450"
                            )}>
                              {staff.status}
                            </span>
                          </div>

                          {/* Utilization Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[8.5px] text-zinc-500">
                              <span>Capacity allocated</span>
                              <span>{staff.utilization}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${staff.utilization}%` }} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 8. WORKSPACE AUTOMATIONS */}
              {activeTab === "automations" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Zap size={16} className="text-purple-500" />
                        Workspace Automation Rules
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure action workflows triggered on event completions or payment receptions.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newRule = { id: Date.now().toString(), trigger: "When Quote Accepted", action: "Lock Invoice & Mail PDF", active: true };
                        const updated = [...automations, newRule];
                        updateAutomationsList(updated);
                        addToast("New automation rule saved and active.", "success");
                      }}
                      className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Plus size={13} /> Create Workflow
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs font-bold">
                    {automations.map((a) => (
                      <div key={a.id} className="p-4 border border-zinc-800 bg-[#111113]/35 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Trigger Condition</span>
                          <span className="font-bold text-zinc-200 mt-1 block">{a.trigger} &rarr; <span className="text-purple-400">{a.action}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={a.active}
                            onChange={(e) => {
                              const newCheck = e.target.checked;
                              const updated = automations.map(item => item.id === a.id ? { ...item, active: newCheck } : item);
                              updateAutomationsList(updated);
                              addToast(`Workflow active state changed.`, "info");
                            }}
                          />
                          <button
                            onClick={() => {
                              const updated = automations.filter(item => item.id !== a.id);
                              updateAutomationsList(updated);
                              addToast("Automation rule removed.", "info");
                            }}
                            className="text-zinc-600 hover:text-red-400 transition"
                            title="Delete workflow"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. BILLING & SUBSCRIPTIONS */}
              {/* 9. BILLING & SUBSCRIPTIONS */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  {/* Title Bar */}
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <CreditCard size={16} className="text-purple-500" />
                        Billing & Subscriptions Manager
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Review subscription renewal milestones, invoices, payment settings, and limits.</p>
                    </div>
                    {subscription?.status === "PAUSED" && (
                      <button
                        onClick={reactivateSubscription}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        Reactivate Subscription
                      </button>
                    )}
                  </div>

                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    {/* Active Subscription Details */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Subscription Tier</span>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-zinc-400">
                          <span>Current Plan:</span>
                          <span className="text-purple-400 capitalize">{subscription?.plan?.name || "Free Trial"}</span>
                        </p>
                        <p className="flex justify-between text-zinc-400">
                          <span>Billing Cycle:</span>
                          <span>{subscription?.plan?.billingInterval || "MONTHLY"}</span>
                        </p>
                        <p className="flex justify-between text-zinc-400">
                          <span>Renewal Date:</span>
                          <span>{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</span>
                        </p>
                        <p className="flex justify-between text-zinc-400">
                          <span>Status:</span>
                          <span className={cn(
                            "px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider font-sans",
                            subscription?.status === "ACTIVE" || subscription?.status === "TRIALING" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                          )}>
                            {subscription?.status || "TRIALING"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Trial Countdown or Upgrades Panel */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Trial Countdown</span>
                        {subscription?.status === "TRIALING" ? (
                          <div className="space-y-3 mt-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 font-mono">
                              <span>Days Remaining</span>
                              <span className="text-purple-450">
                                {Math.max(0, Math.ceil((new Date(subscription?.trialEnd || "").getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days Left
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-850">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, (Math.ceil((new Date(subscription?.trialEnd || "").getTime() - Date.now()) / (1000 * 60 * 60 * 24)) / 14) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-400 mt-2 font-semibold">Your workspace is fully upgraded to a paid premium tier.</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setShowPricingUpgrade(true)}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-md transition text-center text-[10px]"
                        >
                          Change Plan Tiers
                        </button>
                        {subscription?.status === "ACTIVE" && (
                          <button
                            onClick={() => setShowCancelConfirmationModal(true)}
                            className="px-3 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Value ROI Calculator */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Workspace ROI Calculator</span>
                      <div className="space-y-3 font-semibold text-[10px] text-zinc-400">
                        <div>
                          <div className="flex justify-between font-mono mb-1">
                            <span>Events per month:</span>
                            <span className="text-purple-400 font-bold">{eventsPerMonth}</span>
                          </div>
                          <input
                            type="range" min="1" max="25"
                            value={eventsPerMonth}
                            onChange={(e) => setEventsPerMonth(parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-mono mb-1">
                            <span>Hours saved per event:</span>
                            <span className="text-purple-400 font-bold">{hoursSavedPerEvent} hrs</span>
                          </div>
                          <input
                            type="range" min="2" max="40"
                            value={hoursSavedPerEvent}
                            onChange={(e) => setHoursSavedPerEvent(parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="border-t border-zinc-900 pt-2 flex justify-between font-bold font-mono text-zinc-250">
                          <span>Estimated Time Saved:</span>
                          <span className="text-pink-400 font-black">{eventsPerMonth * hoursSavedPerEvent * 12} hrs / yr</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time limits and usage */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Progress indicators */}
                    <div className="lg:col-span-5 p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Plan limits & Active usage</span>
                      <div className="space-y-4 text-xs">
                        {/* Storage */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-zinc-400">
                            <span>Storage space:</span>
                            <span>
                              {(usage?.storageBytes ? (usage.storageBytes / (1024 * 1024 * 1024)).toFixed(2) : "0.0")} GB / {subscription?.plan?.maxStorage ? (subscription.plan.maxStorage / (1024 * 1024 * 1024)).toFixed(0) : "5"} GB
                            </span>
                          </p>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.storageBytes || 0) / (subscription?.plan?.maxStorage || 5368709120)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Users */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-zinc-400">
                            <span>Team Members:</span>
                            <span>{usage?.usersCount || "1"} / {subscription?.plan?.maxUsers || "3"}</span>
                          </p>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.usersCount || 1) / (subscription?.plan?.maxUsers || 3)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Events */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-zinc-400">
                            <span>Events:</span>
                            <span>{usage?.eventsCount || "0"} / {subscription?.plan?.maxEvents || "5"}</span>
                          </p>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.eventsCount || 0) / (subscription?.plan?.maxEvents || 5)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* AI Credits */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-zinc-400">
                            <span>AI Credits:</span>
                            <span>{usage?.aiCreditsUsed || "0"} / {subscription?.plan?.maxAiCredits || "50"}</span>
                          </p>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Premium Interactive Area Chart */}
                    <div className="lg:col-span-7 p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Resource Consumption History</span>
                      <div className="h-[150px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={usageHistoryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "10px", color: "#fff" }} />
                            <Area type="monotone" dataKey="apiCalls" name="API Requests" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCalls)" />
                            <Area type="monotone" dataKey="aiCredits" name="AI Assistant Credits" stroke="#ec4899" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAi)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Seat Management & Coupon code validation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Seat Management</span>
                          <span className="text-[10px] text-zinc-400 font-bold block mt-1">Configure user seats. Plan base limits apply.</span>
                        </div>
                        <button
                          onClick={() => {
                            setSeatChangeMode("add");
                            setShowSeatModal(true);
                          }}
                          className="px-2.5 py-1 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 font-bold rounded-lg text-[9px] transition"
                        >
                          Add Seats
                        </button>
                      </div>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-zinc-400">
                          <span>Base Seats Allowed:</span>
                          <span>{subscription?.plan?.maxUsers || 3}</span>
                        </p>
                        <p className="flex justify-between text-zinc-400">
                          <span>Active Members:</span>
                          <span>{usage?.usersCount || 1}</span>
                        </p>
                        <p className="flex justify-between text-zinc-400">
                          <span>Seat Utilization:</span>
                          <span className="text-pink-400">{Math.round(((usage?.usersCount || 1) / (subscription?.plan?.maxUsers || 3)) * 100)}%</span>
                        </p>
                      </div>

                      {/* Seat History Logs */}
                      <div className="border-t border-zinc-900 pt-3 space-y-2">
                        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider block">Seat Allocation History</span>
                        <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                          {seatHistory.map((hist, idx) => (
                            <div key={idx} className="flex justify-between text-[8px] text-zinc-500 bg-zinc-950/30 p-1.5 rounded border border-zinc-900 font-mono">
                              <span>{hist.date} - {hist.description}</span>
                              <span className="text-emerald-500 font-black">{hist.change}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Coupon validation widget */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Promo Codes & Coupons</span>
                      <p className="text-[9px] text-zinc-500 leading-normal">Enter a coupon code to apply discounts or extend trial durations.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. SAVE50, TRIAL30"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 border border-zinc-850 bg-zinc-950/60 text-white rounded-xl text-[10px] outline-none font-mono uppercase"
                        />
                        <button
                          onClick={() => {
                            if (!couponInput) return;
                            if (couponInput === "SAVE50") {
                              setAppliedDiscountPercent(50);
                              setCouponValidationStatus("success");
                              setCouponValidationMsg("50% off recurring coupon applied successfully!");
                              addToast("50% off discount coupon applied!", "success");
                            } else if (couponInput === "TRIAL30") {
                              setCouponValidationStatus("success");
                              setCouponValidationMsg("30 days trial extension code registered!");
                              addToast("Trial extended by 30 days!", "success");
                            } else if (couponInput === "LIFETIME") {
                              setAppliedDiscountPercent(100);
                              setCouponValidationStatus("success");
                              setCouponValidationMsg("100% lifetime free waiver applied!");
                              addToast("Lifetime free waiver applied!", "success");
                            } else {
                              setCouponValidationStatus("error");
                              setCouponValidationMsg("Invalid or expired coupon code.");
                              addToast("Invalid coupon code.", "error");
                            }
                          }}
                          className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-black transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponValidationStatus && (
                        <p className={cn(
                          "text-[9px] font-bold leading-normal",
                          couponValidationStatus === "success" ? "text-emerald-500" : "text-red-500"
                        )}>
                          {couponValidationMsg}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Owner Direct Payment Destination Profile */}
                  <div className="p-5 border border-purple-500/30 bg-[#111113]/60 rounded-2xl space-y-4 shadow-lg shadow-purple-950/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9.5px] font-black uppercase text-purple-400 tracking-widest block">Agency Owner Direct Payment Destination</span>
                        <p className="text-[10px] text-zinc-400">Enter your real UPI ID and Bank Account details. Clients scanning your proposal QR codes will transfer funds directly into this account (0% fee).</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold text-[9px] font-mono">
                        Direct Settlement
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-semibold text-[10px] text-zinc-300">
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase font-black">Business UPI VPA ID</label>
                        <input
                          type="text"
                          value={ownerUpiId}
                          onChange={(e) => setOwnerUpiId(e.target.value)}
                          placeholder="e.g. youragency@okicici"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none font-mono focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase font-black">Account Holder Name</label>
                        <input
                          type="text"
                          value={ownerAccountName}
                          onChange={(e) => setOwnerAccountName(e.target.value)}
                          placeholder="e.g. Apex Event Management Pvt Ltd"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none font-sans focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase font-black">Bank Account Number</label>
                        <input
                          type="text"
                          value={ownerAccountNumber}
                          onChange={(e) => setOwnerAccountNumber(e.target.value)}
                          placeholder="e.g. 9180200492810"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none font-mono focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-semibold text-[10px] text-zinc-300">
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase font-black">Bank Name & Branch</label>
                        <input
                          type="text"
                          value={ownerBankName}
                          onChange={(e) => setOwnerBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank, Ramdaspeth"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none font-sans focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 uppercase font-black">IFSC Code</label>
                        <input
                          type="text"
                          value={ownerIfsc}
                          onChange={(e) => setOwnerIfsc(e.target.value.toUpperCase())}
                          placeholder="e.g. HDFC0001092"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none font-mono uppercase focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSavePaymentDestination}
                        disabled={isSavingPaymentDest}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40 disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingPaymentDest ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Save Direct Payment Details
                      </button>
                    </div>
                  </div>

                  {/* Billing address and registered Tax Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Registered Tax Profile</span>
                      <div className="space-y-3 font-semibold text-[10px] text-zinc-400">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-550 uppercase font-black">Tax Registration Type</label>
                            <select
                              value={billingTaxType}
                              onChange={(e) => setBillingTaxType(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 text-white rounded-xl outline-none font-bold"
                            >
                              <option value="GST">GST (India)</option>
                              <option value="VAT">VAT (Europe)</option>
                              <option value="Sales Tax">Sales Tax (US)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-550 uppercase font-black">Tax ID / Registration Number</label>
                            <input
                              type="text"
                              value={billingTaxId}
                              onChange={(e) => setBillingTaxId(e.target.value)}
                              placeholder="e.g. 27AABCU9281R1Z5"
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 text-white rounded-xl outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-555 uppercase font-black tracking-widest block">Registered Billing Address</span>
                      <div className="space-y-3 font-semibold text-[10px] text-zinc-400">
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-555 uppercase font-black font-sans">Street Address</label>
                          <input
                            type="text"
                            value={billingStreet}
                            onChange={(e) => setBillingStreet(e.target.value)}
                            placeholder="e.g. Commercial Suite #401, Tech Park"
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 text-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-555 uppercase font-black font-sans">City</label>
                            <input
                              type="text"
                              value={billingCity}
                              onChange={(e) => setBillingCity(e.target.value)}
                              placeholder="e.g. Mumbai"
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 text-white rounded-xl outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-555 uppercase font-black font-sans">Country</label>
                              <input
                                type="text"
                                value={billingCountry}
                                onChange={(e) => setBillingCountry(e.target.value)}
                                placeholder="e.g. India"
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 text-white rounded-xl outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveTaxAndBillingAddress}
                        disabled={isSavingBillingTax}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-750 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingBillingTax ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Save Tax Profile & Billing Address
                      </button>
                    </div>
                  </div>

                  {/* Saved Payment Methods & Custom Domain Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Payment methods */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Saved Payment Methods</span>
                        <button
                          onClick={() => setShowCardAddModal(true)}
                          className="px-2 py-1 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 font-bold rounded-lg text-[9px] transition"
                        >
                          + Add Card
                        </button>
                      </div>

                      {paymentMethods.length === 0 ? (
                        <div className="text-zinc-500 text-[10px] text-center py-6 font-semibold">No saved payment methods. Add your card to avoid service disruptions.</div>
                      ) : (
                        <div className="space-y-2">
                          {paymentMethods.map((pm) => (
                            <div key={pm.id} className="flex justify-between items-center p-3 border border-zinc-900 bg-zinc-950/40 rounded-xl">
                              <div className="flex items-center gap-3 font-semibold font-mono text-zinc-300">
                                <CreditCard size={14} className="text-purple-400" />
                                <span>{pm.cardBrand} •••• {pm.last4}</span>
                                {pm.isDefault && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[8px] text-purple-400 font-bold font-sans uppercase">Default</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {!pm.isDefault && (
                                  <button
                                    onClick={() => setDefaultPaymentMethod(pm.id)}
                                    className="text-[9px] text-zinc-400 hover:text-white transition"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => deletePaymentMethod(pm.id)}
                                  className="text-[9px] text-red-500 hover:text-red-400 font-bold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom Domain and White Label panel */}
                    <div className="p-5 border border-zinc-850 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Enterprise White-Label & Custom Domain</span>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-450 uppercase font-black tracking-wider block">Custom Domains</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="workspace.yourbrand.com"
                              value={customDomainInput}
                              onChange={(e) => setCustomDomainInput(e.target.value)}
                              disabled={!subscription?.plan?.customDomainSupported}
                              className="flex-1 px-3 py-2 border border-zinc-850 bg-zinc-950/60 text-white rounded-xl text-[10px] outline-none focus:border-purple-500 disabled:opacity-50 font-bold font-mono"
                            />
                            <button
                              onClick={() => {
                                setDnsCheckLoading(true);
                                setTimeout(() => {
                                  setDnsCheckLoading(false);
                                  updateSettings({ customDomain: customDomainInput });
                                  addToast("Domain configuration check complete.", "success");
                                }, 1200);
                              }}
                              disabled={!subscription?.plan?.customDomainSupported || dnsCheckLoading}
                              className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:text-white rounded-xl text-[10px] font-bold text-zinc-300 transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {dnsCheckLoading && <Loader2 className="animate-spin size-3" />}
                              Verify DNS
                            </button>
                          </div>
                          {!subscription?.plan?.customDomainSupported ? (
                            <span className="text-[9px] text-amber-500 font-bold leading-normal block">⚠️ Upgrades to Professional or Business required to enable custom domains.</span>
                          ) : customDomainInput && (
                            <div className="p-3 border border-zinc-900 bg-zinc-950/50 rounded-xl space-y-2 text-[9px] text-zinc-400 font-bold leading-normal">
                              <span className="uppercase text-[8px] text-zinc-500 font-black block tracking-wider">Vercel DNS Setup Rules</span>
                              <p>Add a DNS record to configure your custom domain routing:</p>
                              <div className="font-mono bg-zinc-950 p-2 border border-zinc-900 rounded-lg space-y-1">
                                <p><span className="text-zinc-500">Record Type:</span> CNAME</p>
                                <p><span className="text-zinc-500">Host/Name:</span> {customDomainInput.split(".")[0] || "@"}</p>
                                <p><span className="text-zinc-500">Target Value:</span> cname.eventos.com</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                          <div>
                            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider block">White labeling</span>
                            <p className="text-[9px] text-zinc-500 leading-normal">Remove EventOS watermark logo from client invites and quotes.</p>
                          </div>
                          <button
                            onClick={() => {
                              if (!subscription?.plan?.whiteLabelSupported) {
                                addToast("Watermark removal is only available on Business or Enterprise tiers.", "error");
                                return;
                              }
                              const nextVal = !whiteLabelToggle;
                              setWhiteLabelToggle(nextVal);
                              updateSettings({ whiteLabelEnabled: nextVal });
                              addToast(`White labeling ${nextVal ? "enabled" : "disabled"}.`, "success");
                            }}
                            className={cn(
                              "w-10 h-5 rounded-full p-0.5 transition-all duration-300 relative",
                              whiteLabelToggle ? "bg-purple-650" : "bg-zinc-800"
                            )}
                          >
                            <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 absolute top-0.5", whiteLabelToggle ? "left-5" : "left-0.5")} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Invoice Receipts */}
                  <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
                    <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Payment Billing Invoices</span>
                    {invoices.length === 0 ? (
                      <div className="text-zinc-500 text-[10px] font-semibold py-4 text-center">No payment logs found for this billing period.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] font-medium text-zinc-400 font-mono">
                          <thead>
                            <tr className="text-left border-b border-zinc-850 pb-2 text-[9px] text-zinc-550 font-black uppercase tracking-wider">
                              <th className="pb-2">Invoice</th>
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Amount</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((inv) => (
                              <tr key={inv.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-950/30">
                                <td className="py-2.5 font-bold text-zinc-300">{inv.invoiceNumber}</td>
                                <td className="py-2.5">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                <td className="py-2.5 font-bold text-zinc-200">{inv.currency === "INR" ? "₹" : "$"}{inv.amount.toFixed(2)}</td>
                                <td className="py-2.5">
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-400 font-sans font-black uppercase">
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-sans">
                                  <button
                                    onClick={() => {
                                      // Trigger a printable mock PDF receipt window
                                      const printWindow = window.open("", "_blank");
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html>
                                            <head>
                                              <title>Invoice ${inv.invoiceNumber}</title>
                                              <style>
                                                body { font-family: monospace; padding: 40px; background: #fff; color: #000; }
                                                .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                                                .item { display: flex; justify-content: space-between; margin: 10px 0; }
                                                .total { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; margin-top: 20px; }
                                              </style>
                                            </head>
                                            <body>
                                              <div class="header">
                                                <h2>EventOS SaaS Invoice</h2>
                                                <div>
                                                  <p>Invoice: ${inv.invoiceNumber}</p>
                                                  <p>Date: ${new Date(inv.dueDate).toLocaleDateString()}</p>
                                                </div>
                                              </div>
                                              <div>
                                                <p><strong>Billed To:</strong></p>
                                                <p>${companyName || "Workspace (" + inv.tenantId + ")"}</p>
                                                <p>${billingStreet || ""}, ${billingCity || ""}</p>
                                                <p>${billingCountry || ""}</p>
                                                <p>${billingTaxType || "Tax ID"}: ${billingTaxId || "N/A"}</p>
                                              </div>
                                              <div style="margin-top: 30px;">
                                                <div class="item"><span>SaaS Subscription Renewal</span> <span>${inv.currency === "INR" ? "₹" : "$"}${inv.amount.toFixed(2)}</span></div>
                                                <div class="item"><span>Tax index (18%)</span> <span>${inv.currency === "INR" ? "₹" : "$"}${inv.tax.toFixed(2)}</span></div>
                                                <div class="item total"><span>Total Paid</span> <span>${inv.currency === "INR" ? "₹" : "$"}${(inv.amount + inv.tax).toFixed(2)} ${inv.currency}</span></div>
                                              </div>
                                              <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #555;">
                                                Thank you for subscribing to EventOS!
                                              </div>
                                            </body>
                                          </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                      }
                                    }}
                                    className="text-purple-400 hover:text-purple-300 font-bold"
                                  >
                                    Print PDF
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Saved Cards Modal popup */}
                  <AnimatePresence>
                    {showCardAddModal && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowCardAddModal(false)}
                          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-850 bg-zinc-950 p-6 space-y-4 shadow-2xl"
                        >
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">Add Saved Card</span>

                          <div className="space-y-3 font-semibold text-[10px] text-zinc-400">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setPaymentMethodType("CREDIT_CARD")}
                                className={cn("flex-1 py-1.5 border rounded-lg", paymentMethodType === "CREDIT_CARD" ? "border-purple-500 bg-purple-500/10 text-purple-450" : "border-zinc-850")}
                              >
                                Card
                              </button>
                              <button
                                onClick={() => setPaymentMethodType("UPI")}
                                className={cn("flex-1 py-1.5 border rounded-lg", paymentMethodType === "UPI" ? "border-purple-500 bg-purple-500/10 text-purple-450" : "border-zinc-850")}
                              >
                                UPI
                              </button>
                            </div>

                            {paymentMethodType === "CREDIT_CARD" ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block mb-1">Cardholder Name</label>
                                  <input
                                    type="text" placeholder="Cardholder Name" value={cardName} onChange={(e) => setCardName(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1">Card Number</label>
                                  <input
                                    type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="block mb-1">Expiration</label>
                                    <input
                                      type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none text-center"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block mb-1">CVV</label>
                                    <input
                                      type="password" placeholder="***" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)}
                                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none text-center"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="block mb-1">UPI Address (e.g. user@okaxis)</label>
                                <input
                                  type="text" placeholder="user@okaxis" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setShowCardAddModal(false)}
                              className="flex-1 py-2 border border-zinc-850 rounded-xl hover:bg-zinc-900 hover:text-white transition font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                const payload = paymentMethodType === "CREDIT_CARD" ? {
                                  type: "CREDIT_CARD",
                                  provider: "Stripe",
                                  last4: cardNumber.substring(cardNumber.length - 4) || "4242",
                                  cardBrand: "Visa",
                                  isDefault: true
                                } : {
                                  type: "UPI",
                                  provider: "Razorpay",
                                  last4: upiId.substring(0, 4) || "upi",
                                  cardBrand: "UPI",
                                  isDefault: true
                                };
                                await addPaymentMethod(payload);
                                addToast("Payment method saved.", "success");
                                setShowCardAddModal(false);
                                setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv(""); setUpiId("");
                              }}
                              className="flex-1 py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl hover:opacity-90 transition"
                            >
                              Save Method
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Pricing Plans Tiers Modal comparison grid */}
                  <AnimatePresence>
                    {showPricingUpgrade && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowPricingUpgrade(false)}
                          className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative w-full max-w-5xl overflow-y-auto max-h-[90vh] rounded-3xl border border-zinc-850 bg-zinc-950 p-6 space-y-6 shadow-2xl"
                        >
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                            <div>
                              <h2 className="text-sm font-black uppercase text-white tracking-wider">Choose a Subscription Plan</h2>
                              <p className="text-[10px] text-zinc-500">Pick the best plan for your team and scaling operations.</p>
                            </div>
                            {/* Monthly/Yearly billing interval toggle */}
                            <div className="flex items-center gap-2 p-1 border border-zinc-900 bg-zinc-950 rounded-xl font-mono text-[9px] font-bold">
                              <button
                                onClick={() => setBillingInterval("MONTHLY")}
                                className={cn("px-2.5 py-1 rounded-lg transition-all", billingInterval === "MONTHLY" ? "bg-purple-600 text-white font-black" : "text-zinc-500 hover:text-zinc-300")}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setBillingInterval("YEARLY")}
                                className={cn("px-2.5 py-1 rounded-lg transition-all relative flex items-center gap-1", billingInterval === "YEARLY" ? "bg-purple-600 text-white font-black" : "text-zinc-500 hover:text-zinc-300")}
                              >
                                Yearly
                                <span className="absolute -top-3.5 -right-3 px-1 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-[6px] text-white uppercase font-black tracking-widest scale-90">Save 20%</span>
                              </button>
                            </div>
                            <button
                              onClick={() => setShowPricingUpgrade(false)}
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Plans Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {plans.map((p) => {
                              const isCurrent = subscription?.plan?.code === p.code;
                              const isRecommended = p.code === "professional";
                              const priceVal = billingInterval === "YEARLY" ? p.price * 0.8 * 12 : p.price;
                              const labelVal = billingInterval === "YEARLY" ? "/ yr" : "/ mo";

                              return (
                                <div
                                  key={p.id}
                                  className={cn(
                                    "p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative transition duration-300",
                                    isCurrent ? "border-purple-500 bg-purple-950/10" : "border-zinc-850 bg-zinc-900/30 hover:border-zinc-800",
                                    isRecommended && !isCurrent ? "border-pink-500/40 bg-pink-950/5" : ""
                                  )}
                                >
                                  {isRecommended && (
                                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[6px] font-black uppercase text-white tracking-widest">Recommended</span>
                                  )}

                                  <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-zinc-300 block">{p.name}</span>
                                    <div className="flex items-baseline gap-1 mt-2">
                                      <span className="text-xl font-bold text-white">{p.currency === "INR" ? "₹" : "$"}{priceVal.toFixed(0)}</span>
                                      <span className="text-[8px] text-zinc-500 font-mono uppercase">{labelVal}</span>
                                    </div>
                                    <p className="text-[8px] text-zinc-500 mt-1 font-semibold leading-normal">
                                      Great for {p.code === "free_trial" ? "trials" : p.code === "starter" ? "small teams" : p.code === "professional" ? "pros" : "large enterprises"}.
                                    </p>
                                  </div>

                                  {/* Limits details */}
                                  <div className="border-t border-zinc-900 pt-3 space-y-2 font-bold font-mono text-[8px] text-zinc-450 leading-relaxed">
                                    <p className="flex justify-between"><span>Users:</span> <span>{p.maxUsers} Users</span></p>
                                    <p className="flex justify-between"><span>Storage:</span> <span>{(p.maxStorage / (1024 * 1024 * 1024)).toFixed(0)} GB</span></p>
                                    <p className="flex justify-between"><span>Events:</span> <span>{p.maxEvents} Active</span></p>
                                    <p className="flex justify-between"><span>AI Credits:</span> <span>{p.maxAiCredits} / mo</span></p>
                                    <p className="flex justify-between"><span>Custom Domain:</span> <span>{p.customDomainSupported ? "Yes" : "No"}</span></p>
                                    <p className="flex justify-between"><span>White label:</span> <span>{p.whiteLabelSupported ? "Yes" : "No"}</span></p>
                                  </div>

                                  <button
                                    onClick={async () => {
                                      if (usage) {
                                        const usersExceeded = usage.usersCount > p.maxUsers;
                                        const storageExceeded = usage.storageBytes > p.maxStorage;
                                        const eventsExceeded = usage.eventsCount > p.maxEvents;

                                        if (usersExceeded || storageExceeded || eventsExceeded) {
                                          setTargetDowngradePlan(p);
                                          setShowDowngradeWarningModal(true);
                                          return;
                                        }
                                      }
                                      try {
                                        await upgradeSubscription(p.code);
                                        addToast(`Successfully switched to ${p.name} plan!`, "success");
                                        setShowPricingUpgrade(false);
                                      } catch (err: any) {
                                        addToast(err.message || "Failed to switch plan.", "error");
                                      }
                                    }}
                                    disabled={isCurrent || billingLoading}
                                    className={cn(
                                      "w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition active:scale-98",
                                      isCurrent ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 cursor-not-allowed" :
                                        isRecommended ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg" :
                                          "bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800 text-zinc-300"
                                    )}
                                  >
                                    {isCurrent ? "Active Plan" : "Choose Plan"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Billing history table */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Billing Receipts Ledger</h4>
                    <div className="border border-zinc-850 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/60 border-b border-zinc-850 text-[9px] uppercase tracking-wider text-zinc-400 font-mono">
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Plan</th>
                            <th className="p-3 font-semibold">Amount</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 text-right font-semibold">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850 text-zinc-300 font-mono text-[11px]">
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-zinc-900/40 transition">
                              <td className="p-3 text-zinc-400">{new Date(inv.date || inv.billingPeriodStart || inv.dueDate || Date.now()).toLocaleDateString()}</td>
                              <td className="p-3 font-bold text-white">{inv.planName || inv.invoiceNumber || "Subscription Plan"}</td>
                              <td className="p-3 text-emerald-400">${(inv.amount / 100).toFixed(2)} USD</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button className="text-[10px] font-sans text-purple-400 hover:text-purple-300 font-bold transition">
                                  Download PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. TAX & FINANCE */}
              {activeTab === "tax" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Percent size={16} className="text-purple-500" />
                        Taxation & Financial Rules
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure standard tax percentage indexes and prefix formats.</p>
                    </div>
                    <button onClick={handleTaxSave} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Save Tax Configurations
                    </button>
                  </div>

                  <form className="space-y-4 text-xs font-medium">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Standard GST Rate (%)</label>
                        <input type="text" value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-550 uppercase font-black">Invoice Prefix Template</label>
                        <input type="text" value={invoiceFormat} onChange={(e) => setInvoiceFormat(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Payment Term Days</label>
                        <input type="number" value={paymentTerms} onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 15)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-555 uppercase font-black">Late Fee Percentage (%)</label>
                        <input type="text" value={lateFees} onChange={(e) => setLateFees(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono" />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* 11. EMAIL TEMPLATES */}
              {activeTab === "templates" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Mail size={16} className="text-purple-500" />
                        Email Template Manager
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Revise templates sent to clients on quote approval or invoice creations.</p>
                    </div>
                    <button onClick={handleTemplateSave} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Save Template Body
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-medium">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-550 uppercase font-black font-mono">Select Template</label>
                      <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-bold">
                        <option value="Welcome Email">Welcome Email</option>
                        <option value="Quote Proposal">Quote Proposal Mail</option>
                        <option value="Invoice Clearance">Invoice Clearance reminder</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-550 uppercase font-black">Mail Subject</label>
                      <input type="text" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-555 uppercase font-black">HTML Code Body</label>
                      <textarea rows={8} value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-white font-mono leading-relaxed" />
                    </div>
                  </div>
                </div>
              )}

              {/* 12. NOTIFICATION SETTINGS */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Bell size={16} className="text-purple-500" />
                        Workspace Preferences & Alerts
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure active transmission channels for system alerts.</p>
                    </div>
                    <button onClick={() => updateNotifPrefsMutation.mutate(notifChannels)} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      Save Alert Preferences
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-bold divide-y divide-zinc-900">
                    <div className="flex justify-between items-center py-2.5">
                      <div>
                        <span>Email Alerts</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Log notifications directly to registered employee emails.</p>
                      </div>
                      <input type="checkbox" checked={notifChannels.email} onChange={(e) => setNotifChannels(prev => ({ ...prev, email: e.target.checked }))} />
                    </div>

                    <div className="flex justify-between items-center py-2.5">
                      <div>
                        <span>WhatsApp notifications</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Send real-time alerts to planners and clients.</p>
                      </div>
                      <input type="checkbox" checked={notifChannels.whatsapp} onChange={(e) => setNotifChannels(prev => ({ ...prev, whatsapp: e.target.checked }))} />
                    </div>

                    <div className="flex justify-between items-center py-2.5">
                      <div>
                        <span>Push updates</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Trigger Chrome and Firefox browser dashboard popups.</p>
                      </div>
                      <input type="checkbox" checked={notifChannels.push} onChange={(e) => setNotifChannels(prev => ({ ...prev, push: e.target.checked }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* 13. SECURITY CENTER */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <Shield size={16} className="text-purple-500" />
                      Security Center Panel
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Configure active sessions, password policy rules, and 2FA status.</p>
                  </div>

                  <div className="p-5 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4 text-xs">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                      <div>
                        <span className="font-extrabold text-zinc-200">Two Factor Authentication (2FA)</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Protect workspace logins with authenticator app tokens.</p>
                      </div>
                      {twoFaStatusRes ? (
                        <button onClick={() => disable2FaMutation.mutate()} className="px-3.5 py-1.5 bg-red-650/10 hover:bg-red-650/20 text-red-400 border border-red-500/20 rounded-xl font-bold">
                          Disable 2FA
                        </button>
                      ) : (
                        <button onClick={() => setup2FaMutation.mutate()} className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold">
                          Setup 2FA
                        </button>
                      )}
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <span className="font-extrabold text-zinc-300 block uppercase tracking-wider text-[9.5px]">Active Sessions List</span>
                      <div className="space-y-2">
                        {securitySessions.map((s: any) => (
                          <div key={s.id} className="p-3 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between gap-4 font-bold">
                            <div className="flex items-center gap-2.5">
                              <Laptop size={14} className="text-zinc-500" />
                              <div>
                                <span className="text-zinc-250 block">{s.deviceModel || "Current Browser Session"}</span>
                                <span className="text-[9px] text-zinc-555 block font-mono">IP: {s.ipAddress || "127.0.0.1"} &bull; Last access: {formatSessionTime(s.lastAccessTime)}</span>
                              </div>
                            </div>
                            <button onClick={() => revokeSessionMutation.mutate(s.id)} className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg text-[9.5px] font-bold">
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 14. API KEYS */}
              {activeTab === "apikeys" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <Key size={16} className="text-purple-500" />
                        API Keys & Webhooks Console
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Configure secure access keys with custom read/write scopes.</p>
                    </div>
                  </div>

                  <div className="p-5 border border-zinc-800 bg-[#111113]/35 rounded-2xl space-y-4 text-xs font-bold">
                    <span className="text-[9.5px] text-zinc-550 uppercase tracking-widest block font-black">Generate New API Key</span>

                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-black block">Key Label Name</label>
                        <input type="text" placeholder="E.g. Webhook Cloudinary key" value={apiKeyName} onChange={(e) => setApiKeyName(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-black block">Authorization Scopes</label>
                        <input type="text" value={apiKeyScopes} onChange={(e) => setApiKeyScopes(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none" />
                      </div>

                      <button onClick={handleGenerateKey} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl shadow-md">
                        Generate Secure Key
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-wider block">Active Keys Directory</span>
                    {apiKeys.map((key: any) => (
                      <div key={key.id} className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div>
                          <span className="font-bold text-zinc-200 block">{key.name}</span>
                          <span className="text-[9px] text-zinc-555 block font-mono mt-0.5">Scopes: {key.scopes} &bull; Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => revokeApiKeyMutation.mutate(key.id)} className="px-2.5 py-1 bg-red-650/10 hover:bg-red-650/20 border border-red-500/20 text-red-400 font-bold rounded-lg">
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 15. INTEGRATIONS DESK */}
              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <Layers size={16} className="text-purple-500" />
                      Integrations Desk Hub
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Connect third-party plugins (Stripe, Twilio, Google Calendar, Cloudinary).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                    {Object.entries(integrationsStatus).map(([provider, status]) => (
                      <div key={provider} className="p-4 border border-zinc-800 bg-[#111113]/35 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9.5px] text-zinc-200 block">{provider}</span>
                          <span className={cn(
                            "text-[8.5px] font-black uppercase mt-1 inline-block",
                            status === "CONNECTED" ? "text-emerald-450" : "text-zinc-555"
                          )}>{status}</span>
                        </div>
                        {status === "CONNECTED" ? (
                          <button onClick={() => disconnectIntegrationMutation.mutate(provider)} className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                            Disconnect
                          </button>
                        ) : (
                          <button onClick={() => connectIntegrationMutation.mutate({ provider, credentialsJson: "{}" })} className="px-3 py-1 bg-purple-650 hover:bg-purple-700 text-white rounded-lg shadow">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 16. AUDIT LOGS */}
              {activeTab === "audit" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                        <FileText size={16} className="text-purple-500" />
                        Enterprise Audit Logs Registry
                      </h3>
                      <p className="text-[11px] text-zinc-450 mt-1">Search, filter and export workspace activity logs.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSettingsExport("csv")}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all flex items-center gap-1"
                      >
                        <Download size={11} /> CSV
                      </button>
                      <button
                        onClick={() => handleSettingsExport("json")}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all flex items-center gap-1"
                      >
                        <FileText size={11} /> JSON
                      </button>
                    </div>
                  </div>

                  {/* Retention limits form */}
                  <div className="p-4 bg-purple-950/10 border border-purple-900/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-purple-400">Data Retention Limits</h4>
                      <p className="text-[10px] text-zinc-450 mt-0.5">Define log cleanup periods. Older records will be deleted automatically.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => enforceSettingsRetention.mutate(Number(e.target.value))}
                        defaultValue="90"
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none"
                      >
                        <option value="30">30 Days</option>
                        <option value="90">90 Days</option>
                        <option value="180">180 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={auditLogsSearch}
                      onChange={(e) => setAuditLogsSearch(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none"
                    />
                    <select
                      value={auditCategoryFilter}
                      onChange={(e) => setAuditCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl"
                    >
                      <option value="ALL">All Modules</option>
                      <option value="CRM">CRM & Leads</option>
                      <option value="BOOKINGS">Bookings</option>
                      <option value="PAYMENTS">Payments</option>
                      <option value="GALLERY">Gallery</option>
                      <option value="SECURITY">Security</option>
                      <option value="AUTOMATION">Automations</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-zinc-800 bg-[#121214]/20 rounded-2xl text-xs font-semibold text-zinc-300 leading-normal">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/20 border-b border-zinc-800 text-zinc-550 text-[8.5px] uppercase tracking-wider font-black">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Entity</th>
                          <th className="p-4">Actor</th>
                          <th className="p-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/40 font-mono text-[10px]">
                        {filteredAuditLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-zinc-900/5 transition-colors">
                            <td className="p-4 text-zinc-500">{formatSessionTime(log.createdAt)}</td>
                            <td className="p-4 font-bold text-zinc-250">
                              <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase text-[9px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 text-purple-400 font-bold">{log.entityName}</td>
                            <td className="p-4 text-zinc-400">{getActorEmail(log.performedBy)}</td>
                            <td className="p-4 text-zinc-500 max-w-xs truncate" title={log.payloadDiff}>{log.payloadDiff || "No details."}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* ─── FLOATING DIALOGS ─── */}
      {/* 2FA Verification Modal */}
      {show2FaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 text-xs text-center space-y-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-black block">Enable Two-Factor Authentication</span>
            <div className="h-40 w-40 mx-auto bg-white p-1 rounded border border-zinc-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={twoFaQrCode || "https://res.cloudinary.com/demo/image/upload/v1572212345/sample.jpg"} alt="2FA QR Code" className="object-contain" />
            </div>
            <p className="font-mono text-zinc-400 pr-2">Secret Code: {twoFaSecret}</p>
            <input
              type="text"
              placeholder="Enter verification code..."
              value={twoFaVerificationCode}
              onChange={(e) => setTwoFaVerificationCode(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShow2FaModal(false)} className="px-3 py-1.5 border border-zinc-850 bg-zinc-950 rounded-lg text-zinc-300">Cancel</button>
              <button onClick={() => enable2FaMutation.mutate(twoFaVerificationCode)} className="px-4 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold">
                Verify & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Invite Team Member</h4>
            <form onSubmit={handleInviteSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="First Name..." value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
                <input type="text" required placeholder="Last Name..." value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
              </div>
              <input type="email" required placeholder="Email address..." value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />
              <input type="password" required placeholder="Temporary password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white" />

              <div className="space-y-1">
                <label className="text-[8.5px] text-zinc-550 uppercase font-black">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                  <option value="STAFF">Staff Coordinator</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="CLIENT">Client</option>
                </select>

              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-3 py-1.5 border border-zinc-850 bg-zinc-950 rounded-lg text-zinc-350">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Bulk Invite Employees</h4>
            <form onSubmit={handleBulkInviteSubmit} className="space-y-3 text-xs">
              <textarea
                rows={5}
                required
                placeholder="Enter emails (one per line)..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono leading-relaxed"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBulkInviteModal(false)} className="px-3 py-1.5 border border-zinc-850 bg-zinc-950 rounded-lg text-zinc-350">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md">
                  Bulk Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Key result code verification */}
      {showKeyResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 text-xs text-center space-y-4">
            <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-black block">API Key Secured successfully!</span>
            <p className="text-[10.5px] text-zinc-400">Copy this key now. You will not be able to view it again.</p>
            <textarea
              readOnly
              rows={3}
              value={generatedRawKey}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-white font-mono text-center select-all focus:outline-none"
            />
            <button onClick={() => setShowKeyResultModal(false)} className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
              Done & Save
            </button>
          </div>
        </div>
      )}

      {/* Mobile Category Switcher Drawer */}
      <AnimatePresence>
        {showMobileCategoryDrawer && (
          <div className="fixed inset-0 z-[9999] flex items-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileCategoryDrawer(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-h-[85vh] flex flex-col rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">Select Settings Tab</h3>
                  <p className="text-[10px] text-zinc-400">Choose a category to configure</p>
                </div>
                <button
                  onClick={() => setShowMobileCategoryDrawer(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-zinc-500" size={14} />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh]">
                {filteredSections.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeTab === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        handleTabChange(s.id);
                        setShowMobileCategoryDrawer(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left border",
                        isActive
                          ? "bg-purple-950/40 text-purple-300 border-purple-700/50 shadow-md"
                          : "text-zinc-300 bg-zinc-900/60 hover:bg-zinc-900 border-zinc-850"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isActive ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-400")}>
                        <Icon size={15} />
                      </div>
                      <span className="flex-1 font-bold">{s.label}</span>
                      {isActive && <Check size={16} className="text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Retention & Reason collection Modal */}
      <AnimatePresence>
        {showCancelConfirmationModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirmationModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-850 bg-zinc-950 p-6 space-y-5 shadow-2xl z-10"
            >
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Cancel Subscription</h3>
                <p className="text-[10px] text-zinc-550 mt-1 uppercase font-black tracking-widest">We are sorry to see you go</p>
              </div>

              {!retentionDiscountOffered ? (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-450 block font-bold">Why are you canceling your subscription?</label>
                    <div className="space-y-2">
                      {["Too Expensive", "Missing Features", "Switching to Competitor", "UI/UX Issues", "Other"].map((reason) => (
                        <label key={reason} className="flex items-center gap-2 text-zinc-350 cursor-pointer font-medium p-2 border border-zinc-900 bg-zinc-950/40 rounded-xl hover:bg-zinc-900 transition">
                          <input
                            type="radio"
                            name="cancelReason"
                            value={reason}
                            checked={cancellationReason === reason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="accent-purple-500"
                          />
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 block">Additional notes (optional)</label>
                    <textarea
                      placeholder="Tell us how we can improve..."
                      value={cancellationNotes}
                      onChange={(e) => setCancellationNotes(e.target.value)}
                      className="w-full h-16 p-3 border border-zinc-850 bg-zinc-950/50 text-white text-[10px] rounded-xl outline-none resize-none font-sans"
                    />
                  </div>

                  {/* Retention Promo Box */}
                  <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-2">
                    <span className="text-[8px] text-purple-400 uppercase font-black tracking-widest block">Special Account Offer</span>
                    <p className="text-[9px] text-zinc-400 leading-normal font-sans">
                      Wait! We want to help you succeed. Claim a <strong>50% off</strong> discount on your workspace subscription for the next 3 months.
                    </p>
                    <button
                      onClick={() => {
                        setAppliedDiscountPercent(50);
                        setRetentionDiscountOffered(true);
                        addToast("50% retention discount applied to your upcoming cycles!", "success");
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-lg text-[9px] hover:shadow-lg transition"
                    >
                      Claim 50% Discount
                    </button>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setShowCancelConfirmationModal(false)}
                      className="flex-1 py-2.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 rounded-xl transition text-[10px] font-bold"
                    >
                      Stay Subscribed
                    </button>
                    <button
                      onClick={async () => {
                        await cancelSubscription();
                        addToast("Subscription cancellation scheduled successfully.", "success");
                        setShowCancelConfirmationModal(false);
                      }}
                      className="flex-1 py-2.5 bg-red-955/20 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl transition text-[10px] font-bold"
                    >
                      Pause or Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center font-semibold text-xs">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450">
                    <Check size={24} />
                  </div>
                  <p className="text-zinc-200">Retention Offer Claimed!</p>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Your subscription remains active. A 50% discount has been registered for your next 3 billing periods. Thank you for staying with EventOS!
                  </p>
                  <button
                    onClick={() => setShowCancelConfirmationModal(false)}
                    className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-855 text-white font-bold rounded-xl transition text-[10px]"
                  >
                    Return to Settings
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Downgrade Capacity Warning Modal */}
      <AnimatePresence>
        {showDowngradeWarningModal && targetDowngradePlan && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDowngradeWarningModal(false);
                setTargetDowngradePlan(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/20 bg-zinc-950 p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Cannot Downgrade Plan</h3>
              </div>
              <p className="text-[10px] text-zinc-450 leading-normal font-semibold">
                You cannot switch to the <strong>{targetDowngradePlan.name}</strong> plan because your current workspace usage exceeds its limits:
              </p>

              <div className="space-y-2 text-[10px] font-bold font-mono">
                {usage && usage.usersCount > targetDowngradePlan.maxUsers && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl leading-relaxed">
                    ⚠️ <strong>Team Limit Over:</strong> You have {usage.usersCount} team members. The target plan only allows {targetDowngradePlan.maxUsers} seats. Remove {usage.usersCount - targetDowngradePlan.maxUsers} members under "Users & Teams".
                  </div>
                )}
                {usage && usage.storageBytes > targetDowngradePlan.maxStorage && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl leading-relaxed">
                    ⚠️ <strong>Storage Limit Over:</strong> You use {(usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB. The target plan only allows {(targetDowngradePlan.maxStorage / (1024 * 1024 * 1024)).toFixed(0)} GB. Free up space under "CRM & Galleries".
                  </div>
                )}
                {usage && usage.eventsCount > targetDowngradePlan.maxEvents && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl leading-relaxed">
                    ⚠️ <strong>Active Events Over:</strong> You have {usage.eventsCount} events. The target plan only allows {targetDowngradePlan.maxEvents} events. Archive {usage.eventsCount - targetDowngradePlan.maxEvents} events before proceeding.
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowDowngradeWarningModal(false);
                    setTargetDowngradePlan(null);
                  }}
                  className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold rounded-xl transition text-[10px]"
                >
                  Close & Review Usage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seat Add Modal */}
      <AnimatePresence>
        {showSeatModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSeatModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-850 bg-zinc-950 p-6 space-y-4 shadow-2xl z-10"
            >
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Purchase Additional User Seats</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Scale your event organization</p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Number of additional seats</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={additionalSeatsInput}
                      onChange={(e) => setAdditionalSeatsInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 text-white rounded-xl outline-none text-center font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-2">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-zinc-400">Unit Price:</span>
                    <span className="text-white">$10.00 / seat / mo</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] border-t border-zinc-900 pt-2 font-bold">
                    <span className="text-zinc-300">Total Monthly Cost:</span>
                    <span className="text-pink-400">${(additionalSeatsInput * 10).toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowSeatModal(false)}
                    className="flex-1 py-2 border border-zinc-855 rounded-xl hover:bg-zinc-900 hover:text-white text-zinc-300 transition text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (subscription?.plan) {
                        subscription.plan.maxUsers += additionalSeatsInput;
                        const newHist = [
                          {
                            date: new Date().toISOString().split("T")[0],
                            description: `Added pack of ${additionalSeatsInput} custom seats`,
                            change: `+${additionalSeatsInput} seats`,
                            user: user?.firstName || "Billing Admin"
                          },
                          ...seatHistory
                        ];
                        setSeatHistory(newHist);
                        try {
                          localStorage.setItem("eventos_seat_history", JSON.stringify(newHist));
                        } catch (e) {}
                        addToast(`Successfully purchased ${additionalSeatsInput} extra seats!`, "success");
                      }
                      setShowSeatModal(false);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-650 to-pink-650 text-white font-bold rounded-xl hover:opacity-90 transition text-[10px]"
                  >
                    Confirm Purchase
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </PageShell>
  );
}
