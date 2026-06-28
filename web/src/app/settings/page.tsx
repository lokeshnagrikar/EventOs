"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/lib/toastStore";
import {
  Settings,
  Building2,
  Palette,
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  Check,
  Shield,
  Briefcase,
  Sliders,
  DollarSign
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  gstNumber?: string;
  timezone: string;
  currency: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: string;
  role: Role;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [activeSubTab, setActiveSubTab] = useState<"company" | "branding" | "team">("company");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "company" || tabParam === "branding" || tabParam === "team") {
        setActiveSubTab(tabParam as any);
      }
    }
  }, []);

  // Form states for Company
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGst, setCompanyGst] = useState("");
  const [companyCurrency, setCompanyCurrency] = useState("INR");
  const [companyTimezone, setCompanyTimezone] = useState("Asia/Kolkata");

  // Form states for Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#9333ea");
  const [secondaryColor, setSecondaryColor] = useState("#18181b");

  // Form states for Team Member Modal
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [memberError, setMemberError] = useState("");

  // 1. Fetch Company Settings
  const { data: companyRes, isLoading: loadingCompany } = useQuery<{ data: Company }>({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/company");
      // Populate states once loaded
      const data = res.data.data;
      setCompanyName(data.name || "");
      setCompanyEmail(data.email || "");
      setCompanyPhone(data.phone || "");
      setCompanyWebsite(data.website || "");
      setCompanyAddress(data.address || "");
      setCompanyGst(data.gstNumber || "");
      setCompanyCurrency(data.currency || "INR");
      setCompanyTimezone(data.timezone || "Asia/Kolkata");
      setLogoUrl(data.logoUrl || "");
      setPrimaryColor(data.primaryColor || "#9333ea");
      setSecondaryColor(data.secondaryColor || "#18181b");
      return data;
    }
  });

  // 2. Fetch Team Members
  const { data: teamRes, isLoading: loadingTeam } = useQuery<{ data: User[] }>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const res = await api.get("/auth/settings/team");
      return res.data;
    }
  });

  const team = teamRes?.data || [];

  // Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: async (updatedFields: Partial<Company>) => {
      const res = await api.put("/auth/settings/company", updatedFields);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      addToast("Settings saved successfully!", "success");
    },
    onError: (err: any) => {
      addToast("Error saving settings: " + (err.response?.data?.error?.message || err.message), "error");
    }
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (newMember: any) => {
      const res = await api.post("/auth/settings/team", newMember);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      setShowAddMemberModal(false);
      resetMemberForm();
      addToast("Team member added successfully!", "success");
    },
    onError: (err: any) => {
      setMemberError(err.response?.data?.error?.message || "Failed to add member.");
    }
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/auth/settings/team/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      addToast("Member access revoked.", "success");
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error?.message || "Failed to delete member.", "error");
    }
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate({
      name: companyName,
      email: companyEmail || undefined,
      phone: companyPhone || undefined,
      website: companyWebsite || undefined,
      address: companyAddress || undefined,
      gstNumber: companyGst || undefined,
      currency: companyCurrency,
      timezone: companyTimezone
    });
  };

  const handleBrandingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate({
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor
    });
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError("");
    if (!newFirstName || !newEmail || !newPassword) {
      setMemberError("First name, email, and password are required.");
      return;
    }
    // Password strength validation
    if (newPassword.length < 8) {
      setMemberError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setMemberError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setMemberError("Password must contain at least one number.");
      return;
    }
    addTeamMemberMutation.mutate({
      firstName: newFirstName,
      lastName: newLastName || undefined,
      email: newEmail,
      phone: newPhone || undefined,
      password: newPassword,
      role: newRole
    });
  };

  const resetMemberForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setNewRole("STAFF");
    setMemberError("");
  };

  const handleDeleteMember = (userId: string) => {
    if (confirm("Revoke this member's access credentials? This will lock them out of the workspace.")) {
      removeTeamMemberMutation.mutate(userId);
    }
  };

  const isSaving = updateCompanyMutation.isPending;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Workspace Console</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-semibold uppercase font-mono">Control</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Hand Sub-tabs */}
        <aside className="w-full md:w-60 shrink-0 flex flex-col gap-1.5">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
            <Settings size={12} className="text-zinc-500" />
            Configurations
          </h2>
          <button
            onClick={() => setActiveSubTab("company")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "company"
                ? "bg-purple-600/10 text-purple-400 border border-purple-900/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent"
            }`}
          >
            <Building2 size={14} />
            Company Profile
          </button>
          <button
            onClick={() => setActiveSubTab("branding")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "branding"
                ? "bg-purple-600/10 text-purple-400 border border-purple-900/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent"
            }`}
          >
            <Palette size={14} />
            Branding & Style
          </button>
          <button
            onClick={() => setActiveSubTab("team")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "team"
                ? "bg-purple-600/10 text-purple-400 border border-purple-900/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent"
            }`}
          >
            <Users size={14} />
            Team Management
          </button>
          <button
            onClick={() => (window.location.href = "/settings/security")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent transition-all"
          >
            <Shield size={14} />
            Security & Sessions
          </button>
        </aside>

        {/* Content Pane */}
        <section className="flex-1 bg-[#111113]/35 border border-zinc-850 p-6 md:p-8 rounded-2xl">
          
          {/* loading state */}
          {loadingCompany && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 text-xs">
              <Loader2 className="animate-spin text-purple-500" size={24} />
              Loading settings parameters...
            </div>
          )}

          {/* --- COMPANY PROFILE TAB --- */}
          {!loadingCompany && activeSubTab === "company" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold">Company Profile Settings</h3>
                <p className="text-xs text-zinc-450 mt-0.5">Manage GST identifiers, contact points, currencies, and billing addresses.</p>
              </div>

              <form onSubmit={handleCompanySubmit} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">Business Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={companyGst}
                      onChange={(e) => setCompanyGst(e.target.value)}
                      placeholder="E.g., 22AAAAA0000A1Z5"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">Contact Email</label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="sales@agency.com"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">Website URL</label>
                    <input
                      type="text"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://agency.com"
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-wider">Billing Currency</label>
                    <select
                      value={companyCurrency}
                      onChange={(e) => setCompanyCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-medium"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-wider">Business Address</label>
                  <textarea
                    rows={3}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Enter physical business address..."
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all leading-normal"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-850 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
                  >
                    {isSaving ? "Saving details..." : "Save Company Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- BRANDING TAB --- */}
          {!loadingCompany && activeSubTab === "branding" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold">Branding & Layout Appearance</h3>
                <p className="text-xs text-zinc-450 mt-0.5">Customize corporate branding logos and layout themes mapped to your client portals.</p>
              </div>

              <form onSubmit={handleBrandingSubmit} className="space-y-6 text-xs font-medium">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-wider">Company Logo URL</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/demo/image/upload/logo.png"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme Colors */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold tracking-wider">Primary Theme Hex Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-8 w-12 rounded border border-zinc-800 bg-[#18181B] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-1 bg-[#18181B] border border-zinc-800 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold tracking-wider">Secondary Theme Hex Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-8 w-12 rounded border border-zinc-800 bg-[#18181B] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-1 bg-[#18181B] border border-zinc-800 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Preview Panel */}
                  <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/40 flex flex-col justify-between h-[150px]">
                    <span className="text-[10px] font-bold text-zinc-550 uppercase">Branding Preview Banner</span>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Branding logo preview" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="text-zinc-500" size={18} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-200">{companyName || "My Event OS"}</h4>
                        <div className="flex gap-1.5 mt-1.5">
                          <span className="h-3.5 w-12 rounded text-[8px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                            Primary
                          </span>
                          <span className="h-3.5 w-12 rounded text-[8px] font-bold flex items-center justify-center text-zinc-400 border border-zinc-800" style={{ backgroundColor: secondaryColor }}>
                            Secondary
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
                  >
                    {isSaving ? "Saving styling..." : "Save Branding Theme"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- TEAM MANAGEMENT TAB --- */}
          {!loadingCompany && activeSubTab === "team" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold">Team Members & Access Control</h3>
                  <p className="text-xs text-zinc-450 mt-0.5">Control team roles, access states, and register new organizers.</p>
                </div>
                <button
                  onClick={() => {
                    resetMemberForm();
                    setShowAddMemberModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
                >
                  <Plus size={13} />
                  Add Member
                </button>
              </div>

              {/* Members Table */}
              <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/20 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-850 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="p-3">Organiser</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60 font-medium">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-zinc-200">{member.firstName} {member.lastName || ""}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{member.phone || "No phone linked"}</p>
                        </td>
                        <td className="p-3 font-mono text-zinc-400">{member.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                            member.role?.name === "ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : member.role?.name === "MANAGER"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : member.role?.name === "CLIENT"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-750"
                          }`}>
                            {member.role?.name || "STAFF"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
                            member.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                          }`} />
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">{member.status}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={removeTeamMemberMutation.isPending}
                            className="text-zinc-550 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition-colors"
                            title="Revoke access"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {team.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-550">
                          No team members registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* ADD MEMBER DIALOG (MODAL) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="text-purple-500" size={16} />
                Register Team Organizer
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error */}
            {memberError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{memberError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Shyam"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Dubey"
                    className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-bold tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="shyam@company.com"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-bold tracking-wider">Phone number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 99999 88888"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-bold tracking-wider">Security Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-bold tracking-wider">Workspace Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-650 font-bold"
                >
                  <option value="ADMIN">ADMIN - Full Space Authority</option>
                  <option value="MANAGER">MANAGER - Lead & Quote Campaign Authority</option>
                  <option value="STAFF">STAFF - Field Assignment Authority</option>
                  <option value="CLIENT">CLIENT - Review proposals, timeline, & galleries</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTeamMemberMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/10 active:scale-[0.98]"
                >
                  {addTeamMemberMutation.isPending ? "Registering..." : "Register Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
