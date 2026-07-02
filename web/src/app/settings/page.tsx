"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCheck
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

// Sidebar categories mapping
const SECTIONS = [
  { id: "workspace", label: "Workspace Home", icon: Settings, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "company", label: "Company Profile", icon: Building2, roles: ["OWNER", "ADMIN"] },
  { id: "branding", label: "Company Branding", icon: Palette, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "team", label: "Users & Teams", icon: Users, roles: ["OWNER", "ADMIN"] },
  { id: "rbac", label: "Roles & Permissions", icon: UserCheck, roles: ["OWNER", "ADMIN"] },
  { id: "orgchart", label: "Org Chart Hierarchy", icon: Network, roles: ["OWNER", "ADMIN"] },
  { id: "workload", label: "Workload Management", icon: ActivitySquare, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "automations", label: "Workspace Automations", icon: Zap, roles: ["OWNER", "ADMIN"] },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard, roles: ["OWNER", "ADMIN"] },
  { id: "tax", label: "Tax & Finance", icon: Percent, roles: ["OWNER", "ADMIN"] },
  { id: "templates", label: "Email Templates", icon: Mail, roles: ["OWNER", "ADMIN", "COORDINATOR"] },
  { id: "notifications", label: "Notification Settings", icon: Bell, roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
  { id: "security", label: "Security Center", icon: Shield, roles: ["OWNER", "ADMIN", "COORDINATOR", "CLIENT"] },
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
  const [mounted, setMounted] = useState(false);

  const userRole = user?.role || "CLIENT";

  const allowedSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      const anySec = s as any;
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
  const [automations, setAutomations] = useState([
    { id: "1", trigger: "When Lead Created", action: "Assign Salesperson", active: true },
    { id: "2", trigger: "When Booking Confirmed", action: "Assign Coordinator & Send Mail", active: true },
    { id: "3", trigger: "When Payment Received", action: "Auto Generate Receipt PDF", active: false }
  ]);

  // Load saved configurations on mount
  useEffect(() => {
    setMounted(true);
    setRecentTabs(["workspace", "team"]);
  }, []);

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
      } catch (e) {}
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
    queryKey: ["auditLogsSettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/audit");
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
        router.push("/login");
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

  const team = teamRes || [];
  const apiKeys = apiKeysRes || [];
  const auditLogs = auditLogsRes || [];
  const securitySessions = securitySessionsRes || [];
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
  const workloadStats = useMemo(() => {
    if (team.length === 0) {
      return [
        { name: "Rahul (Sales Head)", events: 4, tasks: 12, utilization: 80, status: "BUSY" },
        { name: "Sneha (Planning Lead)", events: 8, tasks: 22, utilization: 95, status: "OVERLOADED" },
        { name: "Amit (Staff)", events: 2, tasks: 5, utilization: 40, status: "AVAILABLE" }
      ];
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

  // Revenue overview timeline data (Mock)
  const revenueChartData = [
    { name: "Jan", Sales: 12000, Revenue: 9500 },
    { name: "Feb", Sales: 18000, Revenue: 14000 },
    { name: "Mar", Sales: 22000, Revenue: 19000 },
    { name: "Apr", Sales: 31000, Revenue: 26000 }
  ];

  // Filtered Audits
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log: any) => {
      const matchSearch = (log.action || "").toLowerCase().includes(auditLogsSearch.toLowerCase()) ||
                          (log.email || "").toLowerCase().includes(auditLogsSearch.toLowerCase());
      const matchCat = auditCategoryFilter === "ALL" || (log.action || "").includes(auditCategoryFilter);
      return matchSearch && matchCat;
    });
  }, [auditLogs, auditLogsSearch, auditCategoryFilter]);

  if (!mounted) return null;

  return (
    <div className="h-screen bg-[#08080a] text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200 select-none" style={{ fontFamily: fontSelection }}>
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[650px] h-[650px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/60 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Workspace Administration Settings</span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-850 border border-zinc-800 rounded text-zinc-400 font-bold uppercase font-mono tracking-wider">Console</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-850 bg-[#111113]/30 backdrop-blur-md flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-850 flex items-center gap-2 relative">
            <Search className="absolute left-7 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search settings tabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/80 border border-zinc-850 rounded-lg text-xs placeholder-zinc-550 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-white"
            />
          </div>

          <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-4">
            {pinnedTabs.length > 0 && searchQuery === "" && (
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1.5 block">Pinned Settings</span>
                <div className="space-y-0.5">
                  {allowedSections.filter((s) => pinnedTabs.includes(s.id)).map((s) => {
                    const Icon = s.icon;
                    const isActive = activeTab === s.id;
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
                        <Star size={11} fill="currentColor" className="text-purple-400" onClick={(e) => { e.stopPropagation(); togglePin(s.id); }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1.5 block font-mono">Console Categories</span>
              <div className="space-y-0.5">
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
        <main data-lenis-prevent className="flex-1 overflow-y-auto p-8 relative">
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
                      <span className="text-xl font-bold font-mono block mt-1">14.8 GB / 500 GB</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Workspace Status</span>
                      <span className="text-xs font-black uppercase text-emerald-450 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full inline-block mt-2">HEALTHY</span>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-[#111113]/30 rounded-2xl">
                      <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Subscription tier</span>
                      <span className="text-sm font-bold block mt-1.5 uppercase text-purple-400 font-mono">Enterprise Grid</span>
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
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
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
                      Save Profile Settings
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
                        <>
                          <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-xl w-36">
                            <span className="text-zinc-500 block uppercase text-[8px]">Sales Head</span>
                            <p className="text-zinc-300 mt-1">Rahul Sharma</p>
                          </div>
                          <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-xl w-36">
                            <span className="text-zinc-500 block uppercase text-[8px]">Planning Lead</span>
                            <p className="text-zinc-300 mt-1">Sneha Rao</p>
                          </div>
                        </>
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
                    {workloadStats.map((staff, idx) => (
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
                    ))}
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
                        const newRule = { id: Math.random().toString(), trigger: "When Quote Accepted", action: "Lock Invoice & Mail PDF", active: true };
                        setAutomations(prev => [...prev, newRule]);
                        addToast("New automation rule generated.", "success");
                      }}
                      className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Create Workflow
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs font-bold">
                    {automations.map((a) => (
                      <div key={a.id} className="p-4 border border-zinc-800 bg-[#111113]/35 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest block">Trigger Condition</span>
                          <span className="font-bold text-zinc-200 mt-1 block">{a.trigger} &rarr; <span className="text-purple-400">{a.action}</span></span>
                        </div>
                        <input
                          type="checkbox"
                          checked={a.active}
                          onChange={(e) => {
                            const newCheck = e.target.checked;
                            setAutomations(prev => prev.map(item => item.id === a.id ? { ...item, active: newCheck } : item));
                            addToast(`Workflow active state changed.`, "info");
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. BILLING & SUBSCRIPTIONS */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-extrabold uppercase text-white flex items-center gap-2">
                      <CreditCard size={16} className="text-purple-500" />
                      Billing & Subscriptions Manager
                    </h3>
                    <p className="text-[11px] text-zinc-450 mt-1">Review subscription renewal milestones, invoices, and storage limits.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-5 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4">
                      <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest block">Billing statistics profile</span>
                      <div className="space-y-2.5 font-bold font-mono">
                        <p className="flex justify-between text-zinc-400"><span>Current Subscription:</span> <span className="text-purple-400">Enterprise Grid</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Allocated storage:</span> <span>14.8 GB of 500 GB</span></p>
                        <p className="flex justify-between text-zinc-400"><span>Renewal milestone:</span> <span>July 15, 2026</span></p>
                      </div>
                    </div>

                    <div className="p-5 border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-zinc-550 uppercase font-black block">Scale Capacity limits</span>
                        <p className="text-[10px] text-zinc-450 mt-1">Upgrade parameters to allocate higher user count capacities.</p>
                      </div>
                      <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md mt-4">
                        Upgrade Organization Subscription
                      </button>
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
                      <option value="ALL">All Categories</option>
                      <option value="ROLE">Role Edits</option>
                      <option value="LOGIN">Logins</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-zinc-800 bg-[#121214]/20 rounded-2xl text-xs font-semibold text-zinc-300 leading-normal">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/20 border-b border-zinc-800 text-zinc-550 text-[8.5px] uppercase tracking-wider font-black">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">Actor</th>
                          <th className="p-4">IP Address</th>
                          <th className="p-4">Device</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/40 font-mono text-[10px]">
                        {filteredAuditLogs.map((log: any) => (
                          <tr key={log.id}>
                            <td className="p-4 text-zinc-500">{formatSessionTime(log.createdAt)}</td>
                            <td className="p-4 font-bold text-zinc-250">{log.action}</td>
                            <td className="p-4 text-purple-400">{getActorEmail(log.userId)}</td>
                            <td className="p-4 text-zinc-400">{log.ipAddress || "127.0.0.1"}</td>
                            <td className="p-4 text-zinc-500">{parseUserAgent(log.userAgent)}</td>
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

    </div>
  );
}
