"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface WaitlistLead {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  whatsapp: string;
  eventType: string;
  currentTools: string;
  joinedAt: string;
  status: "NEW" | "WAITLIST" | "DM_SENT" | "REPLIED" | "DEMO_SCHEDULED" | "FOUNDING_MEMBER" | "ARCHIVED";
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NEW: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/40" },
  WAITLIST: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/40" },
  DM_SENT: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/40" },
  REPLIED: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/40" },
  DEMO_SCHEDULED: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/40" },
  FOUNDING_MEMBER: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40" },
  ARCHIVED: { bg: "bg-zinc-800", text: "text-zinc-400", border: "border-zinc-700" },
};

const STORAGE_KEYS = {
  LEADS: "eventos_crm_leads_v2",
  DELETED_IDS: "eventos_crm_deleted_ids_v2",
  STATUS_OVERRIDES: "eventos_crm_status_overrides_v2",
  PASSKEY: "eventos_founder_key",
};

export default function FounderWaitlistPage() {
  const [passkey, setPasskey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<WaitlistLead | null>(null);
  const [modalForm, setModalForm] = useState({
    name: "",
    agencyName: "",
    email: "",
    whatsapp: "",
    eventType: "Both",
    currentTools: "",
    status: "NEW" as WaitlistLead["status"],
  });

  // Load cached leads and credentials on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cached = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
        }
      }
    } catch {}

    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get("key");
    const savedKey = sessionStorage.getItem(STORAGE_KEYS.PASSKEY) || localStorage.getItem(STORAGE_KEYS.PASSKEY);
    const keyToUse = urlKey || savedKey || "";

    if (keyToUse) {
      setPasskey(keyToUse);
      fetchLeads(keyToUse);
    }
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const reconcileLeads = (serverLeads: WaitlistLead[]): WaitlistLead[] => {
    if (typeof window === "undefined") return serverLeads;

    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_IDS) || "[]");
      const overrides: Record<string, WaitlistLead["status"]> = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.STATUS_OVERRIDES) || "{}"
      );
      const localCached: WaitlistLead[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS) || "[]");

      // 1. Filter out deleted IDs from server
      let active = serverLeads.filter((l) => !deletedIds.includes(l.id));

      // 2. Apply status overrides from local actions
      active = active.map((l) => {
        if (overrides[l.id]) {
          return { ...l, status: overrides[l.id] };
        }
        return l;
      });

      // 3. Keep any manual leads created locally that aren't on server yet
      for (const localLead of localCached) {
        if (!deletedIds.includes(localLead.id) && !active.some((s) => s.id === localLead.id)) {
          active.push(localLead);
        }
      }

      // 4. Save clean reconciled state to localStorage
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(active));
      return active;
    } catch {
      return serverLeads;
    }
  };

  const fetchLeads = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        headers: { "x-founder-key": key },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Invalid Founder Key or unauthorized access.");
      }

      const rawLeads: WaitlistLead[] = data.leads || [];
      const reconciled = reconcileLeads(rawLeads);

      setLeads(reconciled);
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.PASSKEY, key);
      localStorage.setItem(STORAGE_KEYS.PASSKEY, key);
    } catch (err: any) {
      setError(err.message || "Failed to load leads.");
      // If we already have cached leads, keep user authenticated
      if (leads.length > 0) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(passkey);
  };

  // QUICK UPDATE STATUS
  const handleStatusChange = async (id: string, newStatus: WaitlistLead["status"]) => {
    // 1. Optimistic UI update
    const updated = leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l));
    setLeads(updated);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));
      const overrides: Record<string, WaitlistLead["status"]> = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.STATUS_OVERRIDES) || "{}"
      );
      overrides[id] = newStatus;
      localStorage.setItem(STORAGE_KEYS.STATUS_OVERRIDES, JSON.stringify(overrides));
    } catch {}

    showToast(`Pipeline status updated to ${newStatus}`);

    // 3. Dispatch to API
    try {
      await fetch("/api/waitlist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-founder-key": passkey,
        },
        body: JSON.stringify({
          id,
          updates: { status: newStatus },
        }),
      });
    } catch (err: any) {
      console.warn("Server status update sync warning:", err.message);
    }
  };

  // DELETE LEAD
  const handleDeleteLead = async (id: string, agencyName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${agencyName}"?`)) return;

    // 1. Update UI
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);

    // 2. Update localStorage & mark ID as permanently deleted
    try {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));
      const deletedIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_IDS) || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
      }
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(deletedIds));
    } catch {}

    showToast(`Lead "${agencyName}" removed`);

    // 3. Dispatch to API
    try {
      await fetch(`/api/waitlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-founder-key": passkey },
      });
    } catch (err: any) {
      console.warn("Server lead delete sync warning:", err.message);
    }
  };

  // CREATE or UPDATE Lead via Modal
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        // UPDATE (PUT)
        const updated = leads.map((l) =>
          l.id === editingLead.id ? { ...l, ...modalForm } : l
        );
        setLeads(updated);
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));

        await fetch("/api/waitlist", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-founder-key": passkey,
          },
          body: JSON.stringify({
            id: editingLead.id,
            updates: modalForm,
          }),
        });
        showToast("Lead details updated");
      } else {
        // CREATE (POST)
        const newLead: WaitlistLead = {
          id: "wtl_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          ...modalForm,
          joinedAt: new Date().toISOString(),
        };
        const updated = [newLead, ...leads];
        setLeads(updated);
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updated));

        await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modalForm),
        });
        showToast(`Manual lead "${newLead.agencyName}" created`);
      }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err: any) {
      alert("Error saving lead: " + err.message);
    }
  };

  const openCreateModal = () => {
    setEditingLead(null);
    setModalForm({
      name: "",
      agencyName: "",
      email: "",
      whatsapp: "",
      eventType: "Both",
      currentTools: "",
      status: "NEW",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: WaitlistLead) => {
    setEditingLead(lead);
    setModalForm({
      name: lead.name,
      agencyName: lead.agencyName,
      email: lead.email,
      whatsapp: lead.whatsapp,
      eventType: lead.eventType,
      currentTools: lead.currentTools || "",
      status: (lead.status === "WAITLIST" ? "NEW" : lead.status) || "NEW",
    });
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ["ID", "Name", "Agency", "WhatsApp", "Email", "Event Type", "Status", "Current Tools", "Joined At"];
    const rows = leads.map((l) => [
      l.id,
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.agencyName || "").replace(/"/g, '""')}"`,
      `"${(l.whatsapp || "").replace(/"/g, '""')}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.eventType || "").replace(/"/g, '""')}"`,
      `"${l.status || "NEW"}"`,
      `"${(l.currentTools || "").replace(/"/g, '""')}"`,
      `"${new Date(l.joinedAt).toLocaleString()}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `eventos_waitlist_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      lead.name.toLowerCase().includes(term) ||
      lead.agencyName.toLowerCase().includes(term) ||
      lead.whatsapp.includes(searchTerm) ||
      lead.email.toLowerCase().includes(term);

    const leadStatus = lead.status === "WAITLIST" ? "NEW" : lead.status;
    const matchesStatus = statusFilter === "ALL" || leadStatus === statusFilter;
    const matchesEvent = eventFilter === "ALL" || lead.eventType === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-4 font-sans text-white">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl text-center">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center mb-4">
            <Icon icon="solar:shield-keyhole-bold-duotone" className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold font-heading">EventOS Founder HQ</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-5">
            Enter your secret key to view and manage private beta leads.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Enter Founder Key"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all"
            />

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white transition-all cursor-pointer shadow-lg shadow-purple-600/20"
            >
              {loading ? "Verifying..." : "Access Lead Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 p-4 sm:p-8 font-sans">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-emerald-500/40 shadow-xl flex items-center gap-2 text-xs font-semibold text-emerald-400 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <Icon icon="solar:check-circle-bold" className="text-base" />
          <span>{statusToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Inbound Telemetry
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
              Private Beta Waitlist & Mini-CRM
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Founding Cohort #1 • Goal: 25 Qualified Event Agencies
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Icon icon="solar:user-plus-bold" className="text-base" />
              <span>+ Add Manual Lead</span>
            </button>

            <button
              onClick={() => fetchLeads(passkey)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon icon="solar:restart-bold" className="text-sm text-zinc-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!leads.length}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/20 disabled:opacity-40"
            >
              <Icon icon="solar:file-download-bold" className="text-sm" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Leads</span>
            <span className="text-2xl font-black text-white mt-1 block">{leads.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Spots Claimed</span>
            <span className="text-2xl font-black text-purple-300 mt-1 block">
              {leads.length} / 25
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Wedding Focus</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">
              {leads.filter((l) => l.eventType === "Weddings" || l.eventType === "Both").length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Corporate Focus</span>
            <span className="text-2xl font-black text-cyan-300 mt-1 block">
              {leads.filter((l) => l.eventType === "Corporate" || l.eventType === "Both").length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="relative w-full sm:w-72">
            <Icon icon="solar:magnifer-bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
            <input
              type="text"
              placeholder="Search by name, agency, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-[11px] font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Statuses</option>
                <option value="NEW" className="bg-zinc-900 text-white">NEW</option>
                <option value="DM_SENT" className="bg-zinc-900 text-white">DM_SENT</option>
                <option value="REPLIED" className="bg-zinc-900 text-white">REPLIED</option>
                <option value="DEMO_SCHEDULED" className="bg-zinc-900 text-white">DEMO_SCHEDULED</option>
                <option value="FOUNDING_MEMBER" className="bg-zinc-900 text-white">FOUNDING_MEMBER</option>
                <option value="ARCHIVED" className="bg-zinc-900 text-white">ARCHIVED</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-[11px] font-semibold">Type:</span>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Types</option>
                <option value="Weddings" className="bg-zinc-900 text-white">Weddings</option>
                <option value="Corporate" className="bg-zinc-900 text-white">Corporate</option>
                <option value="Both" className="bg-zinc-900 text-white">Both</option>
                <option value="Photography" className="bg-zinc-900 text-white">Photography</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Agency & Contact</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">Current Tools</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Icon icon="solar:clipboard-list-linear" className="text-3xl text-zinc-600" />
                        <span className="text-zinc-400 font-semibold text-sm">No waitlist leads yet</span>
                        <span className="text-xs text-zinc-600 max-w-sm">
                          Share your link <code className="text-purple-400 font-mono">eventosapp.in/waitlist</code> on Instagram to start receiving early bird submissions!
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, "");
                    const waText = encodeURIComponent(
                      `Hi ${lead.name}! Lokesh here, Founder of EventOS. Thanks for joining our Founding Private Beta waitlist for ${lead.agencyName} 🚀 I'd love to learn more about your upcoming events!`
                    );

                    const currentStatus = (lead.status === "WAITLIST" ? "NEW" : lead.status) || "NEW";
                    const style = STATUS_COLORS[currentStatus] || STATUS_COLORS.NEW;

                    return (
                      <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{lead.agencyName}</div>
                          <div className="text-zinc-400 text-xs">{lead.name}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-zinc-300 whitespace-nowrap">
                          {lead.whatsapp}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                          {lead.email}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
                            {lead.eventType}
                          </span>
                        </td>

                        {/* Editable Pipeline Status Dropdown - Sleek Dark Pill */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${style.bg} ${style.text} ${style.border}`}
                              style={{ backgroundColor: "#141418" }}
                            >
                              <option value="NEW" className="bg-[#141418] text-blue-300">NEW</option>
                              <option value="DM_SENT" className="bg-[#141418] text-amber-300">DM_SENT</option>
                              <option value="REPLIED" className="bg-[#141418] text-purple-300">REPLIED</option>
                              <option value="DEMO_SCHEDULED" className="bg-[#141418] text-cyan-300">DEMO_SCHEDULED</option>
                              <option value="FOUNDING_MEMBER" className="bg-[#141418] text-emerald-300">FOUNDING_MEMBER</option>
                              <option value="ARCHIVED" className="bg-[#141418] text-zinc-400">ARCHIVED</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400 max-w-[160px] truncate" title={lead.currentTools}>
                          {lead.currentTools || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono whitespace-nowrap">
                          {new Date(lead.joinedAt).toLocaleDateString()}
                        </td>

                        {/* Actions (WhatsApp + Edit + Delete) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm cursor-pointer"
                              title="Message on WhatsApp"
                            >
                              <Icon icon="solar:chat-round-dots-bold" className="text-sm" />
                              <span>WA</span>
                            </a>

                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit Lead Details"
                            >
                              <Icon icon="solar:pen-bold" className="text-sm" />
                            </button>

                            <button
                              onClick={() => handleDeleteLead(lead.id, lead.agencyName)}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/40 transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-heading">
                {editingLead ? "Edit Lead Details" : "Add Manual Lead"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Heritage Events"
                  value={modalForm.agencyName}
                  onChange={(e) => setModalForm({ ...modalForm, agencyName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={modalForm.whatsapp}
                    onChange={(e) => setModalForm({ ...modalForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@agency.com"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Event Focus</label>
                  <select
                    value={modalForm.eventType}
                    onChange={(e) => setModalForm({ ...modalForm, eventType: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Weddings">Weddings</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Both">Both</option>
                    <option value="Photography">Photography</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Pipeline Status</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="NEW">NEW</option>
                    <option value="DM_SENT">DM_SENT</option>
                    <option value="REPLIED">REPLIED</option>
                    <option value="DEMO_SCHEDULED">DEMO_SCHEDULED</option>
                    <option value="FOUNDING_MEMBER">FOUNDING_MEMBER</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Current Tools</label>
                <input
                  type="text"
                  placeholder="e.g. Excel, WhatsApp groups, Notion"
                  value={modalForm.currentTools}
                  onChange={(e) => setModalForm({ ...modalForm, currentTools: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  {editingLead ? "Save Changes" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
