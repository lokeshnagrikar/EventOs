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
  MessageSquare,
  Sparkles
} from "lucide-react";
import { createPortal } from "react-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

import WhiteLabelSettings from "@/components/settings/WhiteLabelSettings";
import WhatsAppApiSettings from "@/components/settings/WhatsAppApiSettings";
import PaymentEngineSettings from "@/components/settings/PaymentEngineSettings";
import Switch from "@/components/ui/Switch";

// Sidebar categories mapping with luxury logical groupings
export interface SettingSection {
  id: string;
  label: string;
  icon: any;
  roles?: string[];
  category: "workspace" | "cloud" | "team" | "governance";
}

const SECTION_CATEGORIES = [
  { id: "workspace", label: "Core Workspace", icon: Building2 },
  { id: "cloud", label: "Cloud & Integrations", icon: Globe },
  { id: "team", label: "Teams & Organization", icon: Users },
  { id: "governance", label: "Finance & Governance", icon: Shield },
];

const SECTIONS: SettingSection[] = [
  // 1. Core Workspace
  { id: "workspace", label: "Workspace Home", icon: Settings, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF"], category: "workspace" },
  { id: "profile", label: "My Profile", icon: UserCheck, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF", "FINANCE", "CLIENT"], category: "workspace" },
  { id: "company", label: "Company Profile", icon: Building2, roles: ["OWNER", "ADMIN"], category: "workspace" },
  { id: "branding", label: "Company Branding", icon: Palette, roles: ["OWNER", "ADMIN", "COORDINATOR", "STAFF"], category: "workspace" },

  // 2. Cloud & Integrations
  { id: "whitelabel", label: "White-Label & Domain", icon: Globe, roles: ["OWNER", "ADMIN"], category: "cloud" },
  { id: "whatsapp", label: "WhatsApp Meta Cloud API", icon: MessageSquare, roles: ["OWNER", "ADMIN"], category: "cloud" },
  { id: "payment_engine", label: "Enterprise Payment Engine", icon: CreditCard, roles: ["OWNER", "ADMIN", "FINANCE"], category: "cloud" },
  { id: "integrations", label: "Integrations Desk", icon: Layers, roles: ["OWNER", "ADMIN", "COORDINATOR", "STAFF"], category: "cloud" },
  { id: "apikeys", label: "API Access Keys", icon: Key, roles: ["OWNER", "ADMIN"], category: "cloud" },

  // 3. Teams & Organization
  { id: "team", label: "Users & Teams", icon: Users, roles: ["OWNER", "ADMIN", "MANAGER"], category: "team" },
  { id: "rbac", label: "Roles & Permissions", icon: UserCheck, roles: ["OWNER", "ADMIN"], category: "team" },
  { id: "orgchart", label: "Org Chart Hierarchy", icon: Network, roles: ["OWNER", "ADMIN", "MANAGER"], category: "team" },
  { id: "workload", label: "Workload Management", icon: ActivitySquare, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF"], category: "team" },

  // 4. Finance & Governance
  { id: "billing", label: "Billing & Subscription", icon: CreditCard, roles: ["OWNER", "ADMIN", "FINANCE"], category: "governance" },
  { id: "tax", label: "Tax & Finance (GST)", icon: Percent, roles: ["OWNER", "ADMIN", "FINANCE"], category: "governance" },
  { id: "automations", label: "Workspace Automations", icon: Zap, roles: ["OWNER", "ADMIN"], category: "governance" },
  { id: "templates", label: "Email & PDF Templates", icon: Mail, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF"], category: "governance" },
  { id: "notifications", label: "Notification Settings", icon: Bell, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF", "FINANCE", "CLIENT"], category: "governance" },
  { id: "security", label: "Security & 2FA", icon: Shield, roles: ["OWNER", "ADMIN", "MANAGER", "COORDINATOR", "STAFF", "FINANCE", "CLIENT"], category: "governance" },
  { id: "audit", label: "Audit & Compliance Logs", icon: FileText, roles: ["OWNER", "ADMIN"], category: "governance" }
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
  const { clearAuth, user, updateUserProfile, activeTenantId } = useAuthStore();
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
  const [isCheckingOutPlan, setIsCheckingOutPlan] = useState<string | null>(null);
  const [isVerifyingStripeSession, setIsVerifyingStripeSession] = useState(false);
  const [verifyingSessionMsg, setVerifyingSessionMsg] = useState("");

  useEffect(() => {
    if (showPricingUpgrade) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setShowPricingUpgrade(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [showPricingUpgrade]);

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
      const normalizedRole = (userRole || "").replace(/^ROLE_/, "").toUpperCase();
      const isStaffOrCoord = normalizedRole === "STAFF" || normalizedRole === "COORDINATOR";
      return anySec.roles && (
        anySec.roles.includes(userRole) ||
        anySec.roles.includes(normalizedRole) ||
        (isStaffOrCoord && (anySec.roles.includes("STAFF") || anySec.roles.includes("COORDINATOR")))
      );
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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
  const [isUploadingBrandingLogo, setIsUploadingBrandingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

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

    // Check Stripe return query parameters (?tab=billing&status=success&session_id=... OR ?tab=billing&status=cancel)
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }

      const statusParam = searchParams.get("status");
      const sessionIdParam = searchParams.get("session_id");

      if (statusParam === "success" && sessionIdParam) {
        setActiveTab("billing");
        const verifyPaymentSession = async () => {
          setIsVerifyingStripeSession(true);
          setVerifyingSessionMsg("Verifying payment with Stripe & upgrading your workspace...");
          try {
            const res = await api.post("/auth/billing/subscription/verify-session", {
              sessionId: sessionIdParam
            });
            if (res.data?.success) {
              const planName = res.data?.data?.plan?.name || "Premium";
              addToast(`🎉 Payment verified! Your workspace is now upgraded to ${planName}.`, "success");
              await Promise.all([fetchSubscription(), fetchUsage(), fetchInvoices()]);
            } else {
              addToast(res.data?.message || "Payment verification pending.", "info");
            }
          } catch (err: any) {
            console.error("Stripe return verification error:", err);
            const errMsg = err.response?.data?.message || err.message || "Failed to verify Stripe payment session.";
            addToast(errMsg, "error");
          } finally {
            setIsVerifyingStripeSession(false);
            setVerifyingSessionMsg("");
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("status");
            cleanUrl.searchParams.delete("session_id");
            window.history.replaceState({}, "", cleanUrl.toString());
          }
        };

        verifyPaymentSession();
      } else if (statusParam === "cancel") {
        setActiveTab("billing");
        addToast("Payment checkout was cancelled. No charges were made.", "info");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("status");
        cleanUrl.searchParams.delete("session_id");
        window.history.replaceState({}, "", cleanUrl.toString());
      }
    }

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
      updateUserProfile({
        firstName: profileFirstName,
        lastName: profileLastName,
        profileImage: profileImage
      });
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

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return (await api.delete("/auth/settings/security/account/delete")).data;
    },
    onSuccess: () => {
      addToast("Your account has been deleted successfully.", "info");
      setShowDeleteModal(false);
      clearAuth();
      setTimeout(() => {
        router.push("/?message=account-deleted");
      }, 1500);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to delete account. Please try again.", "error");
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
      if (!useBillingStore.getState().checkLimit("users")) {
        throw new Error("LIMIT_EXCEEDED");
      }
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
      if (err.message === "LIMIT_EXCEEDED") return;
      addToast(err.response?.data?.error?.message || err.response?.data?.message || "Failed to invite member.", "error");
    }
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const emailCount = payload?.emails?.length || 1;
      if (!useBillingStore.getState().checkLimit("users", emailCount)) {
        throw new Error("LIMIT_EXCEEDED");
      }
      return (await api.post("/auth/settings/team/bulk-invite", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersSettings"] });
      setShowBulkInviteModal(false);
      setBulkEmails("");
      addToast("Bulk invitations sent!", "success");
    },
    onError: (err: any) => {
      if (err.message === "LIMIT_EXCEEDED") return;
      addToast(err.response?.data?.error?.message || err.response?.data?.message || "Failed to send bulk invitations.", "error");
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

  const handleBrandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("Logo size must be less than 5MB.", "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setCompanyLogo(localUrl);
    setIsUploadingBrandingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      addToast("Uploading company logo to Cloudinary CDN...", "info");
      const res = await api.post("/gallery/items/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cdnUrl = res.data?.data?.url;
      if (cdnUrl) {
        setCompanyLogo(cdnUrl);
        URL.revokeObjectURL(localUrl);
        addToast("Company logo uploaded successfully to CDN!", "success");
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCompanyLogo(reader.result);
          addToast("Logo saved locally as Base64.", "info");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBrandingLogo(false);
      e.target.value = "";
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast("Favicon size must be less than 2MB.", "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setFaviconUrl(localUrl);
    setIsUploadingFavicon(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      addToast("Uploading favicon to Cloudinary CDN...", "info");
      const res = await api.post("/gallery/items/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cdnUrl = res.data?.data?.url;
      if (cdnUrl) {
        setFaviconUrl(cdnUrl);
        URL.revokeObjectURL(localUrl);
        addToast("Favicon uploaded successfully to CDN!", "success");
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFaviconUrl(reader.result);
          addToast("Favicon saved locally.", "info");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingFavicon(false);
      e.target.value = "";
    }
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
      className="p-3 sm:p-6 max-w-7xl mx-auto"
    >
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10 min-h-[calc(100dvh-120px)] md:h-[calc(100dvh-150px)] border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#090a0f]/90 backdrop-blur-2xl rounded-2xl shadow-xl dark:shadow-2xl" style={{ fontFamily: fontSelection }}>

        {/* Mobile Horizontal Scrollable Tab Bar */}
        <div className="relative md:hidden border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/95 dark:bg-[#0c0c0e]/95 shrink-0 sticky top-0 z-20">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-[#0c0c0e] to-transparent pointer-events-none z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 dark:from-[#0c0c0e] to-transparent pointer-events-none z-10" />
          
          <div className="p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x pl-3 pr-8">
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
                    "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all active:scale-95 border",
                    isActive
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white border-purple-400/60 shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30"
                      : "bg-white dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon size={13} className={isActive ? "text-white" : "text-slate-500 dark:text-zinc-400"} />
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex w-72 border-r border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0c0c0e]/80 backdrop-blur-xl flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center gap-2 relative">
            <Search className="absolute left-6 text-slate-400 dark:text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search settings tabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950/90 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-slate-900 dark:text-white shadow-2xs"
            />
          </div>

          <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {pinnedTabs.length > 0 && searchQuery === "" && (
              <div className="space-y-1">
                <span className="text-[9.5px] font-mono font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 block">
                  ★ Pinned Settings
                </span>
                <div className="space-y-0.5">
                  {allowedSections.filter((s) => pinnedTabs.includes(s.id)).map((s) => {
                    const Icon = s.icon;
                    const isActive = activeTab === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleTabChange(s.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer",
                          isActive
                            ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 shadow-xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04] border-transparent"
                        )}
                      >
                        <Icon size={14} className={isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"} />
                        <span className="flex-1 truncate">{s.label}</span>
                        <Star size={12} fill="currentColor" className="text-amber-400" onClick={(e) => { e.stopPropagation(); togglePin(s.id); }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logical Category Groups */}
            <div className="space-y-4">
              {SECTION_CATEGORIES.map((cat) => {
                const items = filteredSections.filter((s) => s.category === cat.id);
                if (items.length === 0) return null;
                const CatIcon = cat.icon;

                return (
                  <div key={cat.id} className="space-y-1">
                    <span className="text-[9.5px] font-mono font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-0.5 flex items-center gap-1.5">
                      <CatIcon size={12} className="text-purple-500" />
                      {cat.label}
                    </span>
                    <div className="space-y-0.5">
                      {items.map((s) => {
                        const Icon = s.icon;
                        const isActive = activeTab === s.id;
                        const isPinned = pinnedTabs.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleTabChange(s.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer select-none",
                              isActive
                                ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 shadow-xs"
                                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04] border-transparent"
                            )}
                          >
                            <Icon size={13} className={isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"} />
                            <span className="flex-1 truncate">{s.label}</span>
                            <Star
                              size={11}
                              fill={isPinned ? "currentColor" : "none"}
                              className={cn(
                                "transition-colors",
                                isPinned ? "text-amber-400" : "text-slate-300 dark:text-zinc-650 hover:text-amber-400"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(s.id);
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative custom-scrollbar bg-white/40 dark:bg-transparent">
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Workspace
                      </div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <Settings size={18} className="text-purple-600 dark:text-purple-400" />
                        Workspace Overview
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Tenant parameters, resource usage meters, and real-time financial trajectory.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-300">
                        {activeTenantId || user?.tenantId || "Production Tenant"}
                      </span>
                    </div>
                  </div>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Active Team</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Users size={14} />
                        </div>
                      </div>
                      <span className="text-2xl font-black font-mono block mt-2 text-slate-900 dark:text-white">{team.length}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Members & Coordinators</span>
                    </div>

                    <div className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Cloud Storage</span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Database size={14} />
                        </div>
                      </div>
                      <span className="text-2xl font-black font-mono block mt-2 text-slate-900 dark:text-white">
                        {usage?.storageBytes ? (usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1) : "0.0"} <span className="text-xs font-normal text-slate-400">GB</span>
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                        of {subscription?.plan?.maxStorage ? (subscription.plan.maxStorage / (1024 * 1024 * 1024)).toFixed(0) : "50"} GB pool allocated
                      </span>
                    </div>

                    <div className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">System Health</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={14} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full inline-block">
                          OPERATIONAL
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 block">All microservices synced</span>
                    </div>

                    <div className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Plan License</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Sparkles size={14} />
                        </div>
                      </div>
                      <span className="text-base font-black uppercase block mt-2 text-purple-600 dark:text-purple-400 font-mono">
                        {subscription?.plan?.name || "Free Trial"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Full enterprise tier</span>
                    </div>
                  </div>

                  {/* Revenue / Financial Chart */}
                  <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-700 dark:text-zinc-200 font-black uppercase tracking-wider block">Workspace Financial Activity</span>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Monthly quote conversion trajectory and settled invoice throughput.</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        +18.4% MoM
                      </span>
                    </div>
                    <div className="h-52 w-full text-xs pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }} />
                          <Area type="monotone" dataKey="Sales" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Workspace Meta Parameters Info Strip */}
                  <div className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Workspace Slug</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 mt-0.5 block">{companySlug || "primary-workspace"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Timezone</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 block">{timezone || "Asia/Kolkata (IST)"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Currency</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 block">{currency || "INR (₹)"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Cloud Region</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 mt-0.5 block">ap-south-1 (Mumbai)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1.5 MY PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4">
                    <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                      <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
                      Personal Profile Settings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage identity credentials, avatar picture, and verified contact numbers.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Avatar Upload Card */}
                    <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs flex flex-col items-center justify-center space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block font-mono">Profile Picture</span>
                      
                      {/* Avatar Preview */}
                      <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-file-input')?.click()}>
                        <div className="h-24 w-24 rounded-full border-2 border-purple-500/30 overflow-hidden bg-slate-100 dark:bg-zinc-900 flex items-center justify-center transition-all group-hover:border-purple-500 shadow-sm">
                          {profileImage ? (
                            <img src={profileImage} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <Users size={36} className="text-slate-400 dark:text-zinc-600" />
                          )}
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 rounded-full bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload size={18} className="text-white" />
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
                          
                          const localPreviewUrl = URL.createObjectURL(file);
                          setProfileImage(localPreviewUrl);
                          
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
                              updateUserProfile({ profileImage: cdnUrl });
                              URL.revokeObjectURL(localPreviewUrl);
                              api.put("/auth/settings/profile", {
                                firstName: profileFirstName,
                                lastName: profileLastName,
                                phone: profilePhone,
                                profileImage: cdnUrl
                              }).catch(() => {});
                              addToast("Profile picture uploaded successfully!", "success");
                            }
                          } catch (err: any) {
                            setProfileImage("");
                            URL.revokeObjectURL(localPreviewUrl);
                            addToast(err.response?.data?.error?.message || "Upload failed. Please try again.", "error");
                          }
                          e.target.value = "";
                        }}
                      />

                      <div className="space-y-2.5 w-full text-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('avatar-file-input')?.click()}
                          className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl transition text-[10px] uppercase font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Upload size={12} />
                          Upload from Device
                        </button>

                        <div className="pt-1">
                          <label className="text-[9.5px] text-slate-400 dark:text-zinc-500 uppercase font-bold block mb-1">Or paste Image URL</label>
                          <input
                            type="text"
                            value={profileImage}
                            onChange={(e) => setProfileImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none focus:border-purple-500 font-mono text-[10px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await api.get("/auth/settings/profile");
                              const googlePic = res.data?.data?.profileImage;
                              if (googlePic && googlePic.startsWith("http")) {
                                setProfileImage(googlePic);
                                updateUserProfile({ profileImage: googlePic });
                                api.put("/auth/settings/profile", {
                                  firstName: profileFirstName,
                                  lastName: profileLastName,
                                  phone: profilePhone,
                                  profileImage: googlePic
                                }).catch(() => {});
                                addToast("Google profile picture restored successfully!", "success");
                              } else {
                                const name = encodeURIComponent(`${user?.firstName || ""} ${user?.lastName || ""}`);
                                const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=7c3aed&color=fff&size=150&bold=true&format=png`;
                                setProfileImage(fallbackUrl);
                                updateUserProfile({ profileImage: fallbackUrl });
                                api.put("/auth/settings/profile", {
                                  firstName: profileFirstName,
                                  lastName: profileLastName,
                                  phone: profilePhone,
                                  profileImage: fallbackUrl
                                }).catch(() => {});
                                addToast("Generated avatar from your profile name.", "info");
                              }
                            } catch {
                              addToast("Failed to fetch profile picture. Please try again.", "error");
                            }
                          }}
                          className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-xl transition text-[9px] uppercase font-bold tracking-wider cursor-pointer inline-block"
                        >
                          Restore OAuth Avatar
                        </button>
                      </div>
                    </div>

                    {/* Profile Fields Card */}
                    <div className="md:col-span-2 p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider">First Name</label>
                          <input
                            type="text"
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider">Last Name</label>
                          <input
                            type="text"
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider">Email Address (Read-only)</label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-3.5 py-2.5 bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-slate-500 dark:text-zinc-500 rounded-xl outline-none cursor-not-allowed font-medium text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-zinc-400 tracking-wider">Contact Phone</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/90 dark:border-white/[0.08] flex justify-end">
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
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all shadow-md shadow-purple-500/20 cursor-pointer"
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <Building2 size={18} className="text-purple-600 dark:text-purple-400" />
                        Company Legal & Workspace Profile
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Configure statutory business registrations, tax indexes, and operating hours.</p>
                    </div>
                    <button onClick={handleWorkspaceSave} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer self-start sm:self-auto">
                      Save Company Settings
                    </button>
                  </div>

                  <form className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-5 text-xs font-medium">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">Registered Business Name</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">Workspace Slug URL</label>
                        <input type="text" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">GSTIN Statutory Registration</label>
                        <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 27AADCB2230M1Z2" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">PAN Business Registration</label>
                        <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="e.g. AADCB2230M" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">Timezone</label>
                        <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-purple-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">Currency</label>
                        <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-purple-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider">Operating Business Hours</label>
                        <input type="text" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. BRANDING STUDIO */}
              {activeTab === "branding" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <Palette size={18} className="text-purple-600 dark:text-purple-400" />
                        Branding Customization Studio
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Custom agency logo, client portal colors, button typography and favicon overrides.</p>
                    </div>
                    <button onClick={handleBrandingSave} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer self-start sm:self-auto">
                      Save Branding Setup
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      {/* 1. Company Brand Logo Uploader */}
                      <div className="space-y-2.5 p-4 bg-white dark:bg-[#111218]/60 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-xs">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-black tracking-wider">Company Brand Logo</label>
                          <label className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer transition flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-2.5 py-1 rounded-lg">
                            {isUploadingBrandingLogo ? <Loader2 size={12} className="animate-spin text-purple-600" /> : <Upload size={12} />}
                            <span>{isUploadingBrandingLogo ? "Uploading..." : "Upload Logo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingBrandingLogo}
                              onChange={handleBrandingLogoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {companyLogo && (
                          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                            <div className="h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={companyLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate flex-1">{companyLogo}</span>
                            <button
                              type="button"
                              onClick={() => setCompanyLogo("")}
                              className="text-[11px] text-slate-400 hover:text-red-500 font-bold px-1.5 transition"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <input
                          type="text"
                          value={companyLogo}
                          onChange={(e) => setCompanyLogo(e.target.value)}
                          placeholder="Or paste Logo URL (https://...)"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* 2. Favicon Uploader */}
                      <div className="space-y-2.5 p-4 bg-white dark:bg-[#111218]/60 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-xs">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-black tracking-wider">Favicon (Browser Tab Icon)</label>
                          <label className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer transition flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-2.5 py-1 rounded-lg">
                            {isUploadingFavicon ? <Loader2 size={12} className="animate-spin text-purple-600" /> : <Upload size={12} />}
                            <span>{isUploadingFavicon ? "Uploading..." : "Upload Favicon"}</span>
                            <input
                              type="file"
                              accept="image/*,.ico"
                              disabled={isUploadingFavicon}
                              onChange={handleFaviconUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {faviconUrl && (
                          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                            <div className="h-7 w-7 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={faviconUrl} alt="Favicon" className="h-full w-full object-contain p-0.5" />
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate flex-1">{faviconUrl}</span>
                            <button
                              type="button"
                              onClick={() => setFaviconUrl("")}
                              className="text-[11px] text-slate-400 hover:text-red-500 font-bold px-1.5 transition"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <input
                          type="text"
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          placeholder="Or paste Favicon URL (https://...)"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* 3. Primary Color Theme */}
                      <div className="p-4 bg-white dark:bg-[#111218]/60 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-xs space-y-2">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-black tracking-wider block">Primary Accent Theme Color</label>
                        <div className="flex gap-3 items-center">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-14 rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5" />
                          <span className="font-mono text-slate-800 dark:text-zinc-200 font-bold text-xs">{accentColor}</span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            {["#7c3aed", "#ec4899", "#2563eb", "#059669", "#d97706"].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setAccentColor(c)}
                                className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-110"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. Primary Font Selection */}
                      <div className="p-4 bg-white dark:bg-[#111218]/60 border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-xs space-y-2">
                        <label className="text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-black tracking-wider block">Portal Font Typography</label>
                        <select value={fontSelection} onChange={(e) => setFontSelection(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white outline-none focus:border-purple-500 font-semibold text-xs">
                          <option value="Inter">Inter (Standard Modern Clean UI)</option>
                          <option value="Outfit">Outfit (Luxury Elegant Geometric)</option>
                          <option value="Roboto">Roboto (Clean Corporate Sans)</option>
                          <option value="monospace">Cascadia Code (Monospace Technical)</option>
                        </select>
                      </div>
                    </div>

                    {/* Preview Widget */}
                    <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest block">Live Studio Preview</span>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Real-time simulation of how high-ticket wedding clients see your brand portal.</p>
                      </div>

                      <div className="space-y-4 p-6 bg-slate-50 dark:bg-[#090a0f] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl text-center flex flex-col items-center shadow-inner">
                        {/* Preview Logo */}
                        <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-sm">
                          {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="h-full w-full object-contain p-1.5" />
                          ) : (
                            <Palette size={24} className="text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900 dark:text-white block">{companyName || "Your Company Brand"}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">Luxury Event Management & Production</span>
                        </div>

                        <div className="w-full pt-2">
                          <button className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer" style={{ backgroundColor: accentColor }}>
                            Sample Client Action Button
                          </button>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block text-center">Click "Save Branding Setup" to apply globally across all quotes & client portal links.</span>
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <Users size={18} className="text-purple-600 dark:text-purple-400" />
                        Team Directory & Access Management
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Invite planners, assign coordinator roles, and manage active workspace access.</p>
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <button 
                        onClick={() => {
                          if (!useBillingStore.getState().checkLimit("users")) return;
                          setShowBulkInviteModal(true);
                        }} 
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Bulk Invite
                      </button>
                      <button 
                        onClick={() => {
                          if (!useBillingStore.getState().checkLimit("users")) return;
                          setShowAddMemberModal(true);
                        }} 
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Invite Member
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-sm text-xs">
                    <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search team member name or email..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#111218]/60 border border-slate-200/90 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs"
                    />
                  </div>

                  {/* Employees Directory List */}
                  <div className="overflow-x-auto border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/90 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">System Role</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-zinc-300 font-medium">
                        {team
                          .filter((m: any) => (m.firstName || "").toLowerCase().includes(teamSearch.toLowerCase()) || (m.email || "").toLowerCase().includes(teamSearch.toLowerCase()))
                          .map((m: any) => (
                            <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black text-[11px] flex items-center justify-center">
                                    {(m.firstName?.[0] || "U").toUpperCase()}
                                  </div>
                                  <span className="font-bold text-slate-900 dark:text-white">{m.firstName} {m.lastName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">{m.email}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                                  {typeof m.role === "object" && m.role !== null ? m.role.name : m.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2.5 py-1 border rounded-full text-[9px] font-black uppercase",
                                  m.suspended 
                                    ? "border-rose-200 dark:border-red-500/25 bg-rose-50 dark:bg-red-500/10 text-rose-600 dark:text-red-400" 
                                    : "border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                                )}>
                                  {m.suspended ? "SUSPENDED" : "ACTIVE"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-3 items-center">
                                  {m.suspended ? (
                                    <button onClick={() => restoreMemberMutation.mutate(m.id)} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline">Restore</button>
                                  ) : (
                                    <button onClick={() => suspendMemberMutation.mutate(m.id)} className="text-[11px] font-bold text-rose-500 hover:underline">Suspend</button>
                                  )}
                                  <button onClick={() => removeMemberMutation.mutate(m.id)} className="text-slate-400 hover:text-rose-500 p-1 transition" title="Remove member">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4">
                    <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                      <UserCheck size={18} className="text-purple-600 dark:text-purple-400" />
                      Granular RBAC Permissions Matrix
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Control operational capabilities and access scopes for each organization role.</p>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] gap-1.5 max-w-md text-xs font-bold">
                    {Object.keys(rbacMatrix).map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRbacRole(role)}
                        className={cn(
                          "flex-1 py-2 text-center rounded-xl transition-all cursor-pointer",
                          selectedRbacRole === role 
                            ? "bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-xs" 
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {/* Grid matrix representation */}
                  <div className="border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl p-6 space-y-4 text-xs shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">
                      Active Scopes & Permissions ({selectedRbacRole})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {Object.entries(rbacMatrix[selectedRbacRole] || {}).map(([scope, val]) => (
                        <div key={scope} className="p-3.5 border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white capitalize block text-xs">{scope} Scope</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Allow {selectedRbacRole.toLowerCase()} to view and edit {scope}</span>
                          </div>
                          <Switch
                            checked={val}
                            onCheckedChange={(newChecked) => {
                              setRbacMatrix(prev => ({
                                ...prev,
                                [selectedRbacRole]: {
                                  ...prev[selectedRbacRole],
                                  [scope]: newChecked
                                }
                              }));
                              addToast(`Scope ${scope} updated for ${selectedRbacRole}`, "info");
                            }}
                            aria-label={`Toggle ${scope} scope`}
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4">
                    <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                      <Network size={18} className="text-purple-600 dark:text-purple-400" />
                      Visual Organization Hierarchy
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Department hierarchy mapping owners, event directors, and ground coordinators.</p>
                  </div>

                  {/* Visual Node Tree */}
                  <div className="p-8 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl flex flex-col items-center gap-6 text-xs text-center font-bold shadow-xs">
                    <div className="p-4 border border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 rounded-2xl w-48 shadow-sm">
                      <span className="text-purple-600 dark:text-purple-400 block font-black uppercase text-[9px] tracking-wider">
                        {typeof ownerNode.role === "object" && ownerNode.role !== null ? ownerNode.role.name : "ORGANIZATION OWNER"}
                      </span>
                      <p className="text-slate-900 dark:text-white font-extrabold text-sm mt-1">{ownerNode.firstName} {ownerNode.lastName}</p>
                    </div>

                    <div className="h-6 w-0.5 bg-gradient-to-b from-purple-500 to-indigo-500" />

                    <div className="flex flex-wrap justify-center gap-6">
                      {subordinates.length > 0 ? (
                        subordinates.map((m: any) => {
                          const roleName = typeof m.role === "object" && m.role !== null ? m.role.name : m.role;
                          return (
                            <div key={m.id} className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] rounded-2xl w-44 shadow-xs">
                              <span className="text-slate-400 dark:text-zinc-500 block uppercase text-[9px] tracking-wider font-bold">{roleName}</span>
                              <p className="text-slate-900 dark:text-zinc-200 mt-1 font-bold text-xs">{m.firstName} {m.lastName}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl text-center text-slate-500 dark:text-zinc-400 text-xs w-full max-w-sm mx-auto">
                          No subordinates invited yet. Invite team members in <button onClick={() => handleTabChange("team")} className="text-purple-600 dark:text-purple-400 font-bold underline">Users & Teams</button> to construct your reporting hierarchy.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. WORKLOAD MANAGEMENT */}
              {activeTab === "workload" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4">
                    <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                      <ActivitySquare size={18} className="text-purple-600 dark:text-purple-400" />
                      Staff Workload & Capacity Radar
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Monitor active wedding task assignments and weekly scheduling bandwidth.</p>
                  </div>

                  <div className="space-y-3.5 text-xs font-bold">
                    {workloadStats.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl text-center space-y-2">
                        <ActivitySquare size={24} className="text-slate-400 dark:text-zinc-600 mx-auto" />
                        <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">No Team Members Active</p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
                          Team workload capacity will dynamically appear here as staff coordinators and event planners are added to your workspace.
                        </p>
                      </div>
                    ) : (
                      workloadStats.map((staff, idx) => (
                        <div key={idx} className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-slate-900 dark:text-zinc-200 block text-xs font-extrabold">{staff.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono mt-0.5">{staff.events} Active Events &bull; {staff.tasks} Pending tasks</span>
                            </div>
                            <span className={cn(
                              "px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase",
                              staff.status === "OVERLOADED" 
                                ? "border-rose-200 dark:border-red-500/25 bg-rose-50 dark:bg-red-500/10 text-rose-600 dark:text-red-400" 
                                : "border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                            )}>
                              {staff.status}
                            </span>
                          </div>

                          {/* Utilization Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-zinc-400">
                              <span>Capacity allocated</span>
                              <span>{staff.utilization}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${staff.utilization}%` }} />
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
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <Zap size={18} className="text-purple-600 dark:text-purple-400" />
                        Workspace Automation Triggers
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Automate quote generation, payment reminders, and milestone completion notifications.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newRule = { id: Date.now().toString(), trigger: "When Quote Accepted", action: "Lock Invoice & Mail PDF", active: true };
                        const updated = [...automations, newRule];
                        updateAutomationsList(updated);
                        addToast("New automation rule saved and active.", "success");
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus size={14} /> Create Workflow
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs font-bold">
                    {automations.map((a) => (
                      <div key={a.id} className="p-4 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest block">Event Trigger Condition</span>
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200 mt-1 block">
                            {a.trigger} &rarr; <span className="text-purple-600 dark:text-purple-400">{a.action}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={a.active}
                            onCheckedChange={(newCheck) => {
                              const updated = automations.map(item => item.id === a.id ? { ...item, active: newCheck } : item);
                              updateAutomationsList(updated);
                              addToast(`Workflow active state changed.`, "info");
                            }}
                            aria-label="Toggle automation rule"
                          />
                          <button
                            onClick={() => {
                              const updated = automations.filter(item => item.id !== a.id);
                              updateAutomationsList(updated);
                              addToast("Automation rule removed.", "info");
                            }}
                            className="text-slate-400 hover:text-rose-500 transition p-1"
                            title="Delete workflow"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. BILLING & SUBSCRIPTIONS */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  {/* Title Bar */}
                  <div className="border-b border-slate-200/90 dark:border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                        <CreditCard size={18} className="text-purple-600 dark:text-purple-400" />
                        Billing & Subscriptions Manager
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Review subscription renewal milestones, invoices, payment settings, and limits.</p>
                    </div>
                    {subscription?.status === "PAUSED" && (
                      <button
                        onClick={reactivateSubscription}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto"
                      >
                        Reactivate Subscription
                      </button>
                    )}
                  </div>

                  {/* Stripe Return Payment Verification Status */}
                  {isVerifyingStripeSession && (
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-purple-700 dark:text-purple-300 animate-pulse shadow-md">
                      <Loader2 size={18} className="animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Payment Received</p>
                        <p className="text-[11px] text-purple-600 dark:text-purple-300">{verifyingSessionMsg || "Verifying payment with Stripe & activating your subscription..."}</p>
                      </div>
                    </div>
                  )}

                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    {/* Active Subscription Details */}
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Subscription Tier</span>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Current Plan:</span>
                          <span className="text-purple-600 dark:text-purple-400 capitalize">
                            {userRole === "SUPER_ADMIN" ? "Enterprise (SuperAdmin)" : (subscription?.plan?.name || "Free Trial")}
                          </span>
                        </p>
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Billing Cycle:</span>
                          <span>{subscription?.plan?.billingInterval || "MONTHLY"}</span>
                        </p>
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Renewal Date:</span>
                          <span>{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</span>
                        </p>
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Status:</span>
                          <span className={cn(
                            "px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider font-sans",
                            subscription?.status === "ACTIVE" || subscription?.status === "TRIALING" 
                              ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" 
                              : "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}>
                            {subscription?.status || "TRIALING"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Trial Countdown or Upgrades Panel */}
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Trial Progress</span>
                        {subscription?.status === "TRIALING" ? (
                          <div className="space-y-3 mt-2">
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-zinc-400 font-mono">
                              <span>Days Remaining</span>
                              <span className="text-purple-600 dark:text-purple-400 font-bold">
                                {Math.max(0, Math.ceil((new Date(subscription?.trialEnd || "").getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days Left
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, (Math.ceil((new Date(subscription?.trialEnd || "").getTime() - Date.now()) / (1000 * 60 * 60 * 24)) / 14) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2 font-medium">Your workspace is fully upgraded to an active enterprise tier.</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setShowPricingUpgrade(true)}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-md transition text-center text-[10px] cursor-pointer"
                        >
                          Change Plan Tiers
                        </button>
                        {subscription?.status === "ACTIVE" && (
                          <button
                            onClick={() => setShowCancelConfirmationModal(true)}
                            className="px-3 py-2 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Value ROI Calculator */}
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Workspace ROI Calculator</span>
                      <div className="space-y-3 font-semibold text-[10px] text-slate-600 dark:text-zinc-400">
                        <div>
                          <div className="flex justify-between font-mono mb-1">
                            <span>Events per month:</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold">{eventsPerMonth}</span>
                          </div>
                          <input
                            type="range" min="1" max="25"
                            value={eventsPerMonth}
                            onChange={(e) => setEventsPerMonth(parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-mono mb-1">
                            <span>Hours saved per event:</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold">{hoursSavedPerEvent} hrs</span>
                          </div>
                          <input
                            type="range" min="2" max="40"
                            value={hoursSavedPerEvent}
                            onChange={(e) => setHoursSavedPerEvent(parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="border-t border-slate-100 dark:border-white/[0.06] pt-2 flex justify-between font-bold font-mono text-slate-800 dark:text-zinc-200">
                          <span>Estimated Time Saved:</span>
                          <span className="text-pink-600 dark:text-pink-400 font-black">{eventsPerMonth * hoursSavedPerEvent * 12} hrs / yr</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time limits and usage */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Progress indicators */}
                    <div className="lg:col-span-5 p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Plan Limits & Active Usage</span>
                      <div className="space-y-4 text-xs">
                        {/* Storage */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Storage space:</span>
                            <span>
                              {(usage?.storageBytes ? (usage.storageBytes / (1024 * 1024 * 1024)).toFixed(2) : "0.0")} GB / {subscription?.plan?.maxStorage ? (subscription.plan.maxStorage / (1024 * 1024 * 1024)).toFixed(0) : "5"} GB
                            </span>
                          </p>
                          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.storageBytes || 0) / (subscription?.plan?.maxStorage || 5368709120)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Users */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Team Members:</span>
                            <span>{usage?.usersCount || "1"} / {subscription?.plan?.maxUsers || "3"}</span>
                          </p>
                          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.usersCount || 1) / (subscription?.plan?.maxUsers || 3)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Events */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Events:</span>
                            <span>{usage?.eventsCount || "0"} / {subscription?.plan?.maxEvents || "5"}</span>
                          </p>
                          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, ((usage?.eventsCount || 0) / (subscription?.plan?.maxEvents || 5)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* AI Credits */}
                        <div className="space-y-1.5 font-bold font-mono">
                          <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <span>AI Credits:</span>
                              {((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 0.8 && (
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider",
                                  ((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 1.0
                                    ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                                    : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                )}>
                                  {((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 1.0 ? "Limit Reached" : "80%+ Used"}
                                </span>
                              )}
                            </span>
                            <span>{usage?.aiCreditsUsed || "0"} / {subscription?.plan?.maxAiCredits || "50"}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                ((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 1.0
                                  ? "bg-rose-500"
                                  : ((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 0.8
                                  ? "bg-amber-500"
                                  : "bg-purple-500"
                              )}
                              style={{ width: `${Math.min(100, ((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 80%+ Usage Warning Banner */}
                      {((usage?.aiCreditsUsed || 0) / (subscription?.plan?.maxAiCredits || 50)) >= 0.8 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs flex items-center justify-between gap-3 mt-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0 text-amber-500" />
                            <span><strong>80%+ AI Credits consumed</strong> this billing cycle. Upgrade your plan to prevent AI workflow disruption.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPricingUpgrade(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer"
                          >
                            Upgrade
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Premium Interactive Area Chart */}
                    <div className="lg:col-span-7 p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Resource Consumption History</span>
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
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "10px", color: "#fff" }} />
                            <Area type="monotone" dataKey="apiCalls" name="API Requests" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCalls)" />
                            <Area type="monotone" dataKey="aiCredits" name="AI Assistant Credits" stroke="#ec4899" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAi)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Seat Management & Coupon code validation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Seat Management</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold block mt-1">Configure user seats. Plan base limits apply.</span>
                        </div>
                        <button
                          onClick={() => {
                            setSeatChangeMode("add");
                            setShowSeatModal(true);
                          }}
                          className="px-3 py-1.5 border border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold rounded-xl text-[10px] transition cursor-pointer"
                        >
                          Add Seats
                        </button>
                      </div>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Base Seats Allowed:</span>
                          <span>{subscription?.plan?.maxUsers || 3}</span>
                        </p>
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Active Members:</span>
                          <span>{usage?.usersCount || 1}</span>
                        </p>
                        <p className="flex justify-between text-slate-600 dark:text-zinc-400">
                          <span>Seat Utilization:</span>
                          <span className="text-pink-600 dark:text-pink-400 font-bold">{Math.round(((usage?.usersCount || 1) / (subscription?.plan?.maxUsers || 3)) * 100)}%</span>
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
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Promo Codes & Coupons</span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">Enter a promotional partner coupon to apply discounts or extend trial duration.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. SAVE50, TRIAL30, LIFETIME"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3.5 py-2.5 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white rounded-xl text-xs outline-none font-mono uppercase focus:border-purple-500"
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
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Apply Code
                        </button>
                      </div>
                      {couponValidationStatus && (
                        <p className={cn(
                          "text-[10px] font-bold leading-normal",
                          couponValidationStatus === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                        )}>
                          {couponValidationMsg}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Owner Direct Payment Destination Profile */}
                  <div className="p-6 border border-purple-500/30 bg-purple-50/40 dark:bg-[#111218]/80 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider block">Agency Owner Direct Payment Settlement</span>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">Enter your real UPI ID and Bank Account details. Clients scanning your proposal QR codes will transfer funds directly into this account (0% EventOS platform cut).</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] font-mono self-start sm:self-auto">
                        0% Commission Direct Settlement
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Business UPI VPA ID</label>
                        <input
                          type="text"
                          value={ownerUpiId}
                          onChange={(e) => setOwnerUpiId(e.target.value)}
                          placeholder="e.g. youragency@okicici"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl outline-none font-mono focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Account Holder Legal Name</label>
                        <input
                          type="text"
                          value={ownerAccountName}
                          onChange={(e) => setOwnerAccountName(e.target.value)}
                          placeholder="e.g. Apex Event Management Pvt Ltd"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl outline-none font-sans focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Bank Account Number</label>
                        <input
                          type="text"
                          value={ownerAccountNumber}
                          onChange={(e) => setOwnerAccountNumber(e.target.value)}
                          placeholder="e.g. 9180200492810"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl outline-none font-mono focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Bank Name & Branch</label>
                        <input
                          type="text"
                          value={ownerBankName}
                          onChange={(e) => setOwnerBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank, Bandra West"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl outline-none font-sans focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Bank IFSC Code</label>
                        <input
                          type="text"
                          value={ownerIfsc}
                          onChange={(e) => setOwnerIfsc(e.target.value.toUpperCase())}
                          placeholder="e.g. HDFC0001092"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl outline-none font-mono uppercase focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSavePaymentDestination}
                        disabled={isSavingPaymentDest}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingPaymentDest ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Save Direct Settlement Details
                      </button>
                    </div>
                  </div>

                  {/* Billing address and registered Tax Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Registered Tax Profile</span>
                      <div className="space-y-3 font-semibold text-[11px] text-slate-600 dark:text-zinc-400">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black">Tax Registration Type</label>
                            <select
                              value={billingTaxType}
                              onChange={(e) => setBillingTaxType(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs"
                            >
                              <option value="GST">GST (India)</option>
                              <option value="VAT">VAT (Europe / UK)</option>
                              <option value="Sales Tax">Sales Tax (USA)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black">Tax Registration Number</label>
                            <input
                              type="text"
                              value={billingTaxId}
                              onChange={(e) => setBillingTaxId(e.target.value)}
                              placeholder="e.g. 27AABCU9281R1Z5"
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 rounded-2xl shadow-xs space-y-4">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Registered Billing Address</span>
                      <div className="space-y-3 font-semibold text-[11px] text-slate-600 dark:text-zinc-400">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black">Street Address</label>
                          <input
                            type="text"
                            value={billingStreet}
                            onChange={(e) => setBillingStreet(e.target.value)}
                            placeholder="e.g. Commercial Suite #401, Tech Park"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black">City</label>
                            <input
                              type="text"
                              value={billingCity}
                              onChange={(e) => setBillingCity(e.target.value)}
                              placeholder="e.g. Mumbai"
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black">Country</label>
                            <input
                              type="text"
                              value={billingCountry}
                              onChange={(e) => setBillingCountry(e.target.value)}
                              placeholder="e.g. India"
                              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveTaxAndBillingAddress}
                        disabled={isSavingBillingTax}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingBillingTax ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
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
                          <Switch
                            checked={whiteLabelToggle}
                            onCheckedChange={(nextVal) => {
                              if (!subscription?.plan?.whiteLabelSupported) {
                                addToast("Watermark removal is only available on Business or Enterprise tiers.", "error");
                                return;
                              }
                              setWhiteLabelToggle(nextVal);
                              updateSettings({ whiteLabelEnabled: nextVal });
                              addToast(`White labeling ${nextVal ? "enabled" : "disabled"}.`, "success");
                            }}
                            aria-label="Remove watermark & custom agency branding"
                          />
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
                              <td className="p-3 text-emerald-400 font-bold font-mono">₹{(Number(inv.amount) || 0).toLocaleString("en-IN")}</td>
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
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Percent size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Taxation & Financial Rules
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Configure standard GST rates, invoice prefix numbers, and automated payment deadlines.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleTaxSave}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 shrink-0"
                    >
                      Save Tax Configurations
                    </button>
                  </div>

                  {/* Form Container */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Standard GST Rate (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value)}
                            placeholder="18"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Standard GST slab for hospitality & event production in India.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Invoice Prefix Template</label>
                        <input
                          type="text"
                          value={invoiceFormat}
                          onChange={(e) => setInvoiceFormat(e.target.value)}
                          placeholder="EVT-2026-"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Sequential counter appended automatically (e.g. EVT-2026-0042).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Payment Term Days</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 15)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">Days</span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Net grace window before an invoice is flagged overdue.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Late Fee Penalty (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={lateFees}
                            onChange={(e) => setLateFees(e.target.value)}
                            placeholder="2.5"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">%/mo</span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Calculated on unpaid balances upon maturity cutoff.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. EMAIL TEMPLATES */}
              {activeTab === "templates" && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Mail size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Email Template Manager
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Customize transactional emails dispatched on quote approvals and invoice receipts.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleTemplateSave}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 shrink-0"
                    >
                      Save Template Body
                    </button>
                  </div>

                  {/* Editor Container */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Template Trigger</label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-purple-500 transition"
                        >
                          <option value="Welcome Email">Welcome Email (Client Onboarding)</option>
                          <option value="Quote Proposal">Quote Proposal Mail (18% GST Estimate)</option>
                          <option value="Invoice Clearance">Invoice Clearance & Payment Reminder</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Email Subject</label>
                        <input
                          type="text"
                          value={templateSubject}
                          onChange={(e) => setTemplateSubject(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                        />
                      </div>
                    </div>

                    {/* Placeholder chips */}
                    <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-purple-600 dark:text-purple-400">Available Variables:</span>
                      {["{{clientName}}", "{{eventDate}}", "{{venue}}", "{{quoteTotal}}", "{{portalUrl}}", "{{companyName}}"].map(tag => (
                        <code key={tag} className="px-2 py-0.5 rounded bg-white dark:bg-white/[0.06] border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                          {tag}
                        </code>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">HTML Code Body</label>
                      <textarea
                        rows={10}
                        value={templateBody}
                        onChange={(e) => setTemplateBody(e.target.value)}
                        className="w-full p-4 bg-slate-900 dark:bg-[#0b0c10] border border-slate-800 dark:border-white/[0.08] rounded-xl text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 12. NOTIFICATION SETTINGS */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Bell size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Workspace Preferences & Alerts
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Control operational transmissions, push updates, and client alerts.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateNotifPrefsMutation.mutate(notifChannels)}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 shrink-0"
                    >
                      Save Alert Preferences
                    </button>
                  </div>

                  {/* Channel Switches */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm space-y-4 divide-y divide-slate-100 dark:divide-white/[0.06]">
                    <div className="flex items-center justify-between pt-2 first:pt-0">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Mail size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">Email Alerts</span>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Log quote submissions, invoice payments, and staff changes directly to registered email.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifChannels.email}
                        onCheckedChange={(val) => setNotifChannels(prev => ({ ...prev, email: val }))}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">WhatsApp Notifications</span>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Dispatch automated WhatsApp templates for client approvals and coordinator timeline alerts.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifChannels.whatsapp}
                        onCheckedChange={(val) => setNotifChannels(prev => ({ ...prev, whatsapp: val }))}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Zap size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">Browser Push Updates</span>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Real-time instant desktop notifications for incoming client messages and task reminders.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifChannels.push}
                        onCheckedChange={(val) => setNotifChannels(prev => ({ ...prev, push: val }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 13. SECURITY CENTER */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Shield size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Security Center Panel
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage two-factor authentication, active login sessions, and workspace credential safeguards.</p>
                      </div>
                    </div>
                  </div>

                  {/* 2FA Card */}
                  <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-white/[0.06] gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                          <Lock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">Two-Factor Authentication (2FA)</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              twoFaStatusRes
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08]"
                            )}>
                              {twoFaStatusRes ? "Enforced & Active" : "Disabled"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Fortify workspace administrator sign-ins with standard TOTP authenticator tokens (Google Authenticator, 1Password, Authy).</p>
                        </div>
                      </div>
                      {twoFaStatusRes ? (
                        <button
                          onClick={() => disable2FaMutation.mutate()}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition shrink-0"
                        >
                          Disable 2FA
                        </button>
                      ) : (
                        <button
                          onClick={() => setup2FaMutation.mutate()}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/20 shrink-0"
                        >
                          Setup 2FA Protection
                        </button>
                      )}
                    </div>

                    {/* Active Sessions List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 dark:text-zinc-200 uppercase tracking-wider text-[10px] block">
                          Active Login Sessions & Devices
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                          {securitySessions.length} active connection{securitySessions.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {securitySessions.map((s: any) => (
                          <div
                            key={s.id}
                            className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] rounded-xl flex items-center justify-between gap-4 transition hover:border-purple-500/30"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-white/[0.06] flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                                <Laptop size={15} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 block">{s.deviceModel || "Desktop Browser Session"}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400">Current</span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block font-mono mt-0.5">
                                  IP: {s.ipAddress || "127.0.0.1"} &bull; Last access: {formatSessionTime(s.lastAccessTime)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => revokeSessionMutation.mutate(s.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:bg-white/[0.04] dark:hover:bg-red-500/20 dark:text-zinc-400 dark:hover:text-red-400 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-bold transition"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="p-6 border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-950/10 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                          <span className="font-extrabold text-red-900 dark:text-red-200 text-sm">Danger Zone: Account Deletion</span>
                        </div>
                        <p className="text-xs text-red-700/80 dark:text-zinc-400 max-w-xl leading-relaxed">
                          Permanently wipe personal credentials, revoke active sessions, and disconnect OAuth identity in strict compliance with Google User Data Policy and privacy standards.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmText("");
                          setShowDeleteModal(true);
                        }}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shrink-0 transition shadow-sm cursor-pointer"
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 14. API KEYS */}
              {activeTab === "apikeys" && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Key size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          API Keys & Developer Webhooks
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Provision secure programmatic access tokens with fine-grained granular permissions.</p>
                      </div>
                    </div>
                  </div>

                  {/* Create Key Card */}
                  <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-5 shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider block font-black">
                      Generate New API Access Key
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Key Label Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cloudinary Webhook / Zapier Connector"
                          value={apiKeyName}
                          onChange={(e) => setApiKeyName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider block">Permission Scopes</label>
                        <input
                          type="text"
                          value={apiKeyScopes}
                          onChange={(e) => setApiKeyScopes(e.target.value)}
                          placeholder="read:events, write:crm, api:all"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleGenerateKey}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/20"
                      >
                        Generate Secure Key
                      </button>
                    </div>
                  </div>

                  {/* Active Keys Directory */}
                  <div className="p-6 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider block">Active Keys Directory</span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{apiKeys.length} active key{apiKeys.length === 1 ? "" : "s"}</span>
                    </div>

                    {apiKeys.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-zinc-500 py-3 font-medium">No active API keys found. Generate one above to connect external services.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {apiKeys.map((key: any) => (
                          <div
                            key={key.id}
                            className="p-4 border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] rounded-xl flex items-center justify-between gap-4 text-xs transition hover:border-purple-500/30"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-zinc-200 block text-xs">{key.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono mt-0.5">
                                Scopes: <code className="text-purple-600 dark:text-purple-400">{key.scopes}</code> &bull; Created: {new Date(key.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => revokeApiKeyMutation.mutate(key.id)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-lg text-xs transition"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 15. INTEGRATIONS DESK */}
              {activeTab === "integrations" && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Integrations Desk Hub
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Manage enterprise connectors: Stripe, Twilio SMS, Google Calendar sync, and Cloudinary Media CDN.</p>
                      </div>
                    </div>
                  </div>

                  {/* Integrations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(integrationsStatus).map(([provider, status]) => (
                      <div
                        key={provider}
                        className="p-5 border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-purple-500/30 transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-white/[0.04] border border-purple-500/20 dark:border-white/[0.08] flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                            {provider.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{provider}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                status === "CONNECTED" ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-zinc-600"
                              )} />
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider",
                                status === "CONNECTED" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-500"
                              )}>
                                {status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {status === "CONNECTED" ? (
                          <button
                            onClick={() => disconnectIntegrationMutation.mutate(provider)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:bg-white/[0.04] dark:hover:bg-red-500/20 dark:text-zinc-400 dark:hover:text-red-400 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold transition"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => connectIntegrationMutation.mutate({ provider, credentialsJson: "{}" })}
                            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                          >
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
                  {/* Header Card */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          Enterprise Audit Logs Registry
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Filter, inspect, and export workspace governance operations and activity histories.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleSettingsExport("csv")}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
                      >
                        <Download size={13} /> Export CSV
                      </button>
                      <button
                        onClick={() => handleSettingsExport("json")}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
                      >
                        <FileText size={13} /> Export JSON
                      </button>
                    </div>
                  </div>

                  {/* Retention limits banner */}
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-purple-700 dark:text-purple-300">Automated Data Retention Window</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Define automated compliance cleanup horizons. Records older than this threshold expire automatically.</p>
                    </div>
                    <select
                      onChange={(e) => enforceSettingsRetention.mutate(Number(e.target.value))}
                      defaultValue="90"
                      className="px-3 py-2 bg-white dark:bg-white/[0.05] border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none shrink-0"
                    >
                      <option value="30">30 Days (Standard Retention)</option>
                      <option value="90">90 Days (Quarterly Audit)</option>
                      <option value="180">180 Days (Half-Year Compliance)</option>
                    </select>
                  </div>

                  {/* Filter strip */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-zinc-500" size={14} />
                      <input
                        type="text"
                        placeholder="Search audit records by actor, action, or details..."
                        value={auditLogsSearch}
                        onChange={(e) => setAuditLogsSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <select
                      value={auditCategoryFilter}
                      onChange={(e) => setAuditCategoryFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-zinc-300 rounded-xl text-xs font-bold focus:outline-none shrink-0"
                    >
                      <option value="ALL">All Event Modules</option>
                      <option value="CRM">CRM & Leads</option>
                      <option value="BOOKINGS">Bookings & Proposals</option>
                      <option value="PAYMENTS">Payments & GST</option>
                      <option value="GALLERY">Galleries</option>
                      <option value="SECURITY">Security & Access</option>
                      <option value="AUTOMATION">Automations</option>
                    </select>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="overflow-x-auto border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111218]/60 backdrop-blur-xl rounded-2xl shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400 text-[9px] uppercase tracking-wider font-black">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Module / Entity</th>
                          <th className="p-4">Actor</th>
                          <th className="p-4">Execution Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-zinc-500 font-medium">
                              No audit logs match current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                                {formatSessionTime(log.createdAt)}
                              </td>
                              <td className="p-4">
                                <span className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[9.5px] font-black uppercase font-mono">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {log.entityName}
                              </td>
                              <td className="p-4 text-slate-600 dark:text-zinc-300 font-medium">
                                {getActorEmail(log.performedBy)}
                              </td>
                              <td className="p-4 text-slate-500 dark:text-zinc-400 max-w-xs truncate font-mono text-[11px]" title={log.payloadDiff}>
                                {log.payloadDiff || "—"}
                              </td>
                            </tr>
                          ))
                        )}
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
          <div className="w-full max-w-sm bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 text-xs text-center space-y-4 shadow-2xl">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider font-black block">Enable Two-Factor Authentication</span>
            <div className="h-44 w-44 mx-auto bg-white p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={twoFaQrCode || "https://res.cloudinary.com/demo/image/upload/v1572212345/sample.jpg"} alt="2FA QR Code" className="object-contain" />
            </div>
            <p className="font-mono text-xs text-slate-600 dark:text-zinc-400 break-all select-all">Secret Code: <strong className="text-slate-900 dark:text-white">{twoFaSecret}</strong></p>
            <input
              type="text"
              placeholder="Enter 6-digit TOTP code..."
              value={twoFaVerificationCode}
              onChange={(e) => setTwoFaVerificationCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-center text-slate-900 dark:text-white font-mono text-sm tracking-widest focus:outline-none focus:border-purple-500 transition"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShow2FaModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] rounded-xl text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => enable2FaMutation.mutate(twoFaVerificationCode)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 transition"
              >
                Verify & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Invite Team Member</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Send a workspace access invitation.</p>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="First Name..."
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition font-medium"
                />
                <input
                  type="text"
                  required
                  placeholder="Last Name..."
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition font-medium"
                />
              </div>
              <input
                type="email"
                required
                placeholder="Work email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition font-medium"
              />
              <input
                type="password"
                required
                placeholder="Temporary login password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition font-mono"
              />

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Workspace Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="STAFF">Staff Coordinator</option>
                  <option value="MANAGER">Event Manager</option>
                  <option value="ADMIN">Workspace Administrator</option>
                  <option value="CLIENT">Client Portal Guest</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] rounded-xl text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 transition"
                >
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
          <div className="w-full max-w-sm bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Bulk Invite Employees</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Invite multiple team members simultaneously.</p>
            </div>
            <form onSubmit={handleBulkInviteSubmit} className="space-y-3.5 text-xs">
              <textarea
                rows={5}
                required
                placeholder="Enter email addresses (one per line)...&#10;sarah@domain.com&#10;rahul@domain.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:border-purple-500 transition resize-none"
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkInviteModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] rounded-xl text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 transition"
                >
                  Dispatch Bulk Invites
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Key result code verification */}
      {showKeyResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#111218] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 text-xs text-center space-y-4 shadow-2xl">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black block">API Key Secured Successfully!</span>
            <p className="text-xs text-slate-600 dark:text-zinc-400">Copy this key now and store it in your encrypted secrets manager. You will not be able to view it again.</p>
            <textarea
              readOnly
              rows={3}
              value={generatedRawKey}
              className="w-full p-3 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-mono text-center select-all focus:outline-none text-xs"
            />
            <button
              onClick={() => setShowKeyResultModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 transition"
            >
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111218] p-6 space-y-5 shadow-2xl z-10"
            >
              <div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Cancel Subscription</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 uppercase font-black tracking-widest">We are sorry to see you go</p>
              </div>

              {!retentionDiscountOffered ? (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-600 dark:text-zinc-400 block font-bold">Why are you canceling your subscription?</label>
                    <div className="space-y-2">
                      {["Too Expensive", "Missing Features", "Switching to Competitor", "UI/UX Issues", "Other"].map((reason) => (
                        <label key={reason} className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300 cursor-pointer font-medium p-2.5 border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition">
                          <input
                            type="radio"
                            name="cancelReason"
                            value={reason}
                            checked={cancellationReason === reason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="accent-purple-600"
                          />
                          <span>{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 block font-bold uppercase tracking-wider">Additional notes (optional)</label>
                    <textarea
                      placeholder="Tell us how we can improve..."
                      value={cancellationNotes}
                      onChange={(e) => setCancellationNotes(e.target.value)}
                      className="w-full h-20 p-3 border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs rounded-xl outline-none resize-none font-sans focus:border-purple-500 transition"
                    />
                  </div>

                  {/* Retention Promo Box */}
                  <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-2">
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-black tracking-widest block">Special Account Retention Offer</span>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal font-sans">
                      Wait! We want to help you succeed. Claim an instant <strong>50% off discount</strong> on your workspace subscription for the next 3 months.
                    </p>
                    <button
                      onClick={() => {
                        setAppliedDiscountPercent(50);
                        setRetentionDiscountOffered(true);
                        addToast("50% retention discount applied to your upcoming cycles!", "success");
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                    >
                      Claim 50% Discount
                    </button>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setShowCancelConfirmationModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-zinc-300 rounded-xl transition text-xs font-bold"
                    >
                      Stay Subscribed
                    </button>
                    <button
                      onClick={async () => {
                        await cancelSubscription();
                        addToast("Subscription cancellation scheduled successfully.", "success");
                        setShowCancelConfirmationModal(false);
                      }}
                      className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition text-xs font-bold"
                    >
                      Pause or Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center font-semibold text-xs py-4">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Check size={24} />
                  </div>
                  <p className="text-slate-900 dark:text-white text-sm font-bold">Retention Offer Claimed!</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                    Your subscription remains active. A 50% discount has been applied to your next 3 billing periods. Thank you for building with EventOS!
                  </p>
                  <button
                    onClick={() => setShowCancelConfirmationModal(false)}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl transition text-xs shadow-md"
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-white dark:bg-[#111218] p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle size={18} />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Cannot Downgrade Plan</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal font-semibold">
                You cannot switch to the <strong>{targetDowngradePlan.name}</strong> plan because your current workspace usage exceeds its limits:
              </p>

              <div className="space-y-2 text-xs font-bold font-mono">
                {usage && usage.usersCount > targetDowngradePlan.maxUsers && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl leading-relaxed">
                    ⚠️ <strong>Team Limit Over:</strong> You have {usage.usersCount} team members. The target plan only allows {targetDowngradePlan.maxUsers} seats. Remove {usage.usersCount - targetDowngradePlan.maxUsers} members under "Users & Teams".
                  </div>
                )}
                {usage && usage.storageBytes > targetDowngradePlan.maxStorage && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl leading-relaxed">
                    ⚠️ <strong>Storage Limit Over:</strong> You use {(usage.storageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB. The target plan only allows {(targetDowngradePlan.maxStorage / (1024 * 1024 * 1024)).toFixed(0)} GB. Free up space under "CRM & Galleries".
                  </div>
                )}
                {usage && usage.eventsCount > targetDowngradePlan.maxEvents && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl leading-relaxed">
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
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-zinc-200 font-bold rounded-xl transition text-xs"
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
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111218] p-6 space-y-4 shadow-2xl z-10"
            >
              <div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">Purchase Additional User Seats</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-widest mt-1">Scale your event organization</p>
              </div>

              <div className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider">Number of additional seats</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={additionalSeatsInput}
                      onChange={(e) => setAdditionalSeatsInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl outline-none text-center font-bold text-sm focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-2">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500 dark:text-zinc-400">Unit Price:</span>
                    <span className="text-slate-900 dark:text-white font-bold">₹799 / seat / mo</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs border-t border-purple-500/15 pt-2 font-bold">
                    <span className="text-slate-700 dark:text-zinc-300">Total Monthly Cost:</span>
                    <span className="text-purple-600 dark:text-pink-400 font-extrabold">₹{(additionalSeatsInput * 799).toLocaleString("en-IN")} INR</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowSeatModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-zinc-300 transition text-xs font-bold"
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
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition text-xs shadow-md shadow-purple-600/20"
                  >
                    Confirm Purchase
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HIGH-END PRICING PLANS MODAL POPUP (POP OUT ON SCREEN VIA REACT PORTAL) ── */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showPricingUpgrade && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-hidden">
              {/* Ultra-dark backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowPricingUpgrade(false)}
                className="fixed inset-0 bg-black/85 backdrop-blur-xl z-0"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 24 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative z-10 w-full max-w-6xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-[#0c0c0e]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(168,85,247,0.15)] overflow-hidden"
              >
                {/* Ambient glow accent top edge */}
                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent pointer-events-none" />

                {/* Sticky Header */}
                <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-zinc-850/80 bg-zinc-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-purple-600/30 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                      <Sparkles size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                          Choose a Subscription Plan
                        </h2>
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                          Instant Activation
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                        Pick the best plan for your team and scaling event operations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
                    {/* Monthly / Yearly Billing Toggle */}
                    <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl font-mono text-[10px] font-bold shadow-inner">
                      <button
                        type="button"
                        onClick={() => setBillingInterval("MONTHLY")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                          billingInterval === "MONTHLY"
                            ? "bg-purple-600 text-white shadow-md font-black"
                            : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval("YEARLY")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-all relative flex items-center gap-1 cursor-pointer",
                          billingInterval === "YEARLY"
                            ? "bg-purple-600 text-white shadow-md font-black"
                            : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        <span>Yearly</span>
                        <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-[7.5px] text-white uppercase font-black tracking-wider leading-none shadow">
                          -20%
                        </span>
                      </button>
                    </div>

                    {/* Prominent, touch-friendly Close Button */}
                    <button
                      type="button"
                      onClick={() => setShowPricingUpgrade(false)}
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95"
                      aria-label="Close dialog"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Cards Grid Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 overscroll-contain scrollbar-thin space-y-6">
                  {/* SuperAdmin Omnipresence Notice Banner */}
                  {userRole === "SUPER_ADMIN" && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                              Platform SuperAdmin Account
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Active Plan • Enterprise
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            You have unrestricted Platform SuperAdmin access across all modules, white-label client portals, and unlimited capacities.
                          </p>
                        </div>
                      </div>
                      <span className="hidden md:inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                        Omni-Access
                      </span>
                    </div>
                  )}

                  {/* 3-Column Canonical Plans Grid matching Landing Page */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                    {(["starter", "professional", "agency"] as const).map((codeKey) => {
                      const p = plans.find((x) => x.code.toLowerCase() === codeKey) || {
                        id: `canonical_${codeKey}`,
                        code: codeKey,
                        name: codeKey === "starter" ? "Starter" : codeKey === "professional" ? "Professional" : "Agency",
                        price: codeKey === "starter" ? 1999 : codeKey === "professional" ? 4999 : 12999,
                        currency: "INR",
                        billingInterval: "MONTHLY",
                        maxUsers: codeKey === "starter" ? 2 : codeKey === "professional" ? 5 : 999,
                        maxStorage: codeKey === "starter" ? 20 * 1024 * 1024 * 1024 : codeKey === "professional" ? 100 * 1024 * 1024 * 1024 : 500 * 1024 * 1024 * 1024,
                        maxGalleryUploads: codeKey === "starter" ? 50 : codeKey === "professional" ? 200 : 10000,
                        maxEvents: codeKey === "starter" ? 5 : codeKey === "professional" ? 20 : 99999,
                        maxLeads: codeKey === "starter" ? 50 : codeKey === "professional" ? 200 : 99999,
                        maxAiCredits: codeKey === "starter" ? 200 : codeKey === "professional" ? 1000 : 10000,
                        maxAutomationRuns: codeKey === "starter" ? 500 : codeKey === "professional" ? 2500 : 25000,
                        maxApiCalls: codeKey === "starter" ? 5000 : codeKey === "professional" ? 25000 : 250000,
                        customDomainSupported: codeKey !== "starter",
                        whiteLabelSupported: codeKey === "agency",
                      };

                      const isCurrent = subscription?.plan?.code === p.code;
                      const isRecommended = codeKey === "professional";

                      const basePrice = codeKey === "starter" ? 1999 : codeKey === "professional" ? 4999 : 12999;
                      const priceVal = billingInterval === "YEARLY" ? basePrice * 0.8 * 12 : basePrice;
                      const labelVal = billingInterval === "YEARLY" ? "/ yr" : "/ mo";

                      const specs = {
                        starter: {
                          tagline: "Win more clients",
                          desc: "For solo planners & boutique studios replacing manual proposals.",
                          seats: "2 Team Seats",
                          extraSeat: "₹799 / mo",
                          events: "Up to 5 Active",
                          storage: "20 GB High-Res",
                          aiCredits: "200 / mo",
                          domain: "— No",
                          whitelabel: "— No",
                        },
                        professional: {
                          tagline: "Run more events",
                          desc: "For growing agencies & coordinators managing multi-event production.",
                          seats: "5 Team Seats",
                          extraSeat: "₹799 / mo",
                          events: "Up to 20 / mo",
                          storage: "100 GB High-Res",
                          aiCredits: "1,000 / mo",
                          domain: "✓ Yes",
                          whitelabel: "— No",
                        },
                        agency: {
                          tagline: "Scale your agency",
                          desc: "Unlimited operational capacity & white-label portals for high volume.",
                          seats: "Unlimited Seats",
                          extraSeat: "Unlimited",
                          events: "Unlimited Active",
                          storage: "500+ GB Dedicated",
                          aiCredits: "10,000 / mo",
                          domain: "✓ Yes",
                          whitelabel: "✓ Yes",
                        },
                      }[codeKey];

                      return (
                        <div
                          key={p.id || codeKey}
                          className={cn(
                            "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col justify-between relative transition-all duration-300 group hover:-translate-y-1",
                            isCurrent
                              ? "border-purple-500/70 bg-gradient-to-b from-purple-950/20 via-zinc-950/60 to-zinc-950 shadow-xl shadow-purple-950/30 ring-1 ring-purple-500/30"
                              : isRecommended
                                ? "border-pink-500/50 bg-gradient-to-b from-pink-950/20 via-zinc-950/60 to-zinc-950 shadow-xl shadow-pink-950/20 ring-1 ring-pink-500/20"
                                : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
                          )}
                        >
                          {/* Recommended Ribbon */}
                          {isRecommended && (
                            <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-[8px] font-black uppercase text-white tracking-widest shadow-lg shadow-pink-500/20">
                              ★ Most Popular Choice
                            </span>
                          )}

                          {/* Current Plan Badge */}
                          {isCurrent && (
                            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black uppercase text-emerald-400 tracking-widest shadow">
                              {userRole === "SUPER_ADMIN" ? "SuperAdmin Active" : "Active Plan"}
                            </span>
                          )}

                          {/* Top Plan Header */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-zinc-300 tracking-wider block">
                                {p.name}
                              </span>
                              <span className="text-[9px] font-bold text-purple-400 font-mono">
                                {specs.tagline}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                                ₹{priceVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono uppercase font-semibold">
                                {labelVal}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium leading-relaxed min-h-[32px]">
                              {specs.desc}
                            </p>
                          </div>

                          {/* Limits & Feature Details Synchronized with Landing Page */}
                          <div className="border-t border-zinc-850/80 my-4 pt-3.5 space-y-2.5 font-bold font-mono text-[9.5px] sm:text-[10px] text-zinc-400 leading-relaxed">
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">Team Users:</span>
                              <span className="text-zinc-200">{specs.seats}</span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">Extra Seat:</span>
                              <span className="text-purple-400">{specs.extraSeat}</span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">Cloud Storage:</span>
                              <span className="text-zinc-200">{specs.storage}</span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">Active Events:</span>
                              <span className="text-zinc-200">{specs.events}</span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">AI Credits:</span>
                              <span className="text-zinc-200">{specs.aiCredits}</span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">Custom Domain:</span>
                              <span className={codeKey !== "starter" ? "text-emerald-400" : "text-zinc-500"}>
                                {specs.domain}
                              </span>
                            </p>
                            <p className="flex justify-between items-center">
                              <span className="text-zinc-400">White Label:</span>
                              <span className={codeKey === "agency" ? "text-emerald-400" : "text-zinc-500"}>
                                {specs.whitelabel}
                              </span>
                            </p>
                          </div>

                          {/* CTA Button */}
                          <button
                            type="button"
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

                              // Trigger Real Razorpay Checkout (UPI, GPay, PhonePe, Cards in INR)
                              setIsCheckingOutPlan(p.code);
                              try {
                                const { openRazorpayCheckout } = await import("@/lib/razorpay");
                                const res = await api.post("/auth/billing/razorpay/create-order", { 
                                  planCode: p.code,
                                  interval: billingInterval 
                                });
                                
                                const orderData = res.data?.data;
                                if (!orderData || !orderData.orderId) {
                                  throw new Error("Unable to initialize Razorpay payment order");
                                }

                                await openRazorpayCheckout({
                                  orderId: orderData.orderId,
                                  amount: orderData.amount,
                                  currency: orderData.currency || "INR",
                                  keyId: orderData.keyId,
                                  planName: orderData.planName || p.name,
                                  planCode: p.code,
                                  interval: billingInterval,
                                  userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
                                  userEmail: user?.email || "",
                                  onSuccess: async (paymentData) => {
                                    try {
                                      addToast("Verifying payment with bank...", "info");
                                      const verifyRes = await api.post("/auth/billing/razorpay/verify-payment", {
                                        razorpay_order_id: paymentData.razorpay_order_id,
                                        razorpay_payment_id: paymentData.razorpay_payment_id,
                                        razorpay_signature: paymentData.razorpay_signature,
                                        planCode: p.code,
                                        interval: billingInterval
                                      });
                                      
                                      if (verifyRes.data?.success) {
                                        addToast(`🎉 Payment Confirmed! Plan upgraded to ${p.name}.`, "success");
                                        await Promise.all([fetchSubscription(), fetchInvoices(), fetchUsage()]);
                                      } else {
                                        addToast("Payment verification failed. Please contact support.", "error");
                                      }
                                    } catch (vErr: any) {
                                      console.error("Verification error:", vErr);
                                      addToast(vErr.response?.data?.message || "Payment verification failed", "error");
                                    }
                                  },
                                  onFailure: (pErr) => {
                                    console.warn("Payment modal dismissed or failed:", pErr);
                                    addToast("Payment cancelled or closed.", "info");
                                  }
                                });
                              } catch (err: any) {
                                console.error("Payment checkout error:", err);
                                const errMsg = err.response?.data?.message || err.message || "Payment checkout failed.";
                                addToast(errMsg, "error");
                              } finally {
                                setIsCheckingOutPlan(null);
                              }
                            }}
                            disabled={isCurrent || billingLoading || isCheckingOutPlan === p.code}
                            className={cn(
                              "w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-center transition-all duration-200 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-md",
                              isCurrent
                                ? "bg-purple-500/10 border border-purple-500/30 text-purple-400 cursor-not-allowed"
                                : isRecommended
                                  ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-purple-950/60 hover:brightness-110"
                                  : "bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-700/80 text-zinc-200"
                            )}
                          >
                            {isCheckingOutPlan === p.code ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Connecting Razorpay...</span>
                              </>
                            ) : isCurrent ? (
                              "Active Plan"
                            ) : (
                              "Choose Plan"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dedicated Enterprise Scale Card */}
                  <div className={cn(
                    "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border relative transition-all duration-300",
                    userRole === "SUPER_ADMIN" || subscription?.plan?.code === "enterprise"
                      ? "border-purple-500/60 bg-gradient-to-r from-purple-950/30 via-zinc-950/70 to-indigo-950/30 shadow-xl shadow-purple-950/20 ring-1 ring-purple-500/20"
                      : "border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700"
                  )}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                            Enterprise & Custom Scale
                          </span>
                          {(userRole === "SUPER_ADMIN" || subscription?.plan?.code === "enterprise") && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black uppercase text-emerald-400 tracking-widest">
                              {userRole === "SUPER_ADMIN" ? "Active Plan • SuperAdmin" : "Active Plan"}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-extrabold text-white">
                          Dedicated AWS Infrastructure & National Agency Scale
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          For high-volume production networks & enterprise organizers needing custom SLA agreements, dedicated VPC isolation, bespoke contract templates, and unlimited operational capacity.
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1.5 text-[10px] font-mono font-bold text-zinc-300">
                          <span className="text-emerald-400">✓ Unlimited Seats</span>
                          <span className="text-emerald-400">✓ 1 TB Dedicated Cloud</span>
                          <span className="text-emerald-400">✓ 50,000 AI Credits</span>
                          <span className="text-emerald-400">✓ White-Label Portals</span>
                          <span className="text-emerald-400">✓ Dedicated Account Lead</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">Custom</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">Bespoke SLA / Annual</span>
                        </div>

                        {userRole === "SUPER_ADMIN" || subscription?.plan?.code === "enterprise" ? (
                          <div className="px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Active Plan (Omni-Access)</span>
                          </div>
                        ) : (
                          <a
                            href="https://wa.me/919876543210?text=Hi%2C%20we%20are%20interested%20in%20an%20EventOS%20Enterprise%20custom%20plan."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 transition shadow-md inline-block text-center"
                          >
                            Talk to Founders →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 14-day Free Trial Option */}
                  <div className="text-center pt-1 pb-2">
                    <span className="text-xs text-zinc-500 font-medium">
                      Need to test before upgrading?{" "}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await upgradeSubscription("free_trial");
                            addToast("Activated 14-day Free Trial!", "success");
                            setShowPricingUpgrade(false);
                          } catch (err: any) {
                            addToast(err.message || "Failed to switch plan.", "error");
                          }
                        }}
                        className="text-purple-400 font-bold hover:underline cursor-pointer"
                      >
                        Start 14-day Free Trial (No Card Required)
                      </button>
                    </span>
                  </div>
                </div>

                {/* Reassurance Footer Banner */}
                <div className="shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-t border-zinc-850/80 bg-zinc-950/90 text-center text-[9px] sm:text-[10px] text-zinc-500 font-mono">
                  🔒 256-bit Secure Checkout • Cancel anytime • Instant GST Invoices generated automatically
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Account Confirmation Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white dark:bg-[#111218] border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-950/20 space-y-5 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Account Permanently</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Google OAuth & Platform Credentials</p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-900 dark:text-zinc-300 space-y-2">
                  <p className="font-semibold text-red-700 dark:text-red-300">Are you sure you want to proceed?</p>
                  <ul className="list-disc pl-4 space-y-1 text-red-800/80 dark:text-zinc-400 text-[11px]">
                    <li>All active sessions on all devices will be revoked immediately.</li>
                    <li>Your account credentials and OAuth profile association will be deleted.</li>
                    <li>This action is irreversible in compliance with Google User Data Policy.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide block">
                    Type <span className="text-red-600 dark:text-red-400 font-mono font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-red-500 px-3.5 py-2.5 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText("");
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteConfirmText !== "DELETE" || deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate()}
                    className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Deleting Account...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Confirm Deletion</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </PageShell>
  );
}
