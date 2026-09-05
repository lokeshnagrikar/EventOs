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
  status: "NEW" | "DM_SENT" | "REPLIED" | "DEMO_SCHEDULED" | "FOUNDING_MEMBER" | "ARCHIVED";
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DM_SENT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  REPLIED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DEMO_SCHEDULED: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  FOUNDING_MEMBER: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ARCHIVED: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function FounderWaitlistPage() {
  const [passkey, setPasskey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Auto-login if previously verified in session
  useEffect(() => {
    const saved = sessionStorage.getItem("eventos_founder_key");
    if (saved) {
      setPasskey(saved);
      fetchLeads(saved);
    }
  }, []);

  const fetchLeads = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/waitlist?key=${encodeURIComponent(key)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Invalid Founder Key or unauthorized.");
      }

      setLeads(data.leads || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("eventos_founder_key", key);
    } catch (err: any) {
      setError(err.message || "Failed to load leads.");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(passkey);
  };

  // CREATE or UPDATE Lead
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        // UPDATE (PUT)
        const res = await fetch("/api/waitlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: passkey,
            id: editingLead.id,
            updates: modalForm,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
        setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? data.lead : l)));
      } else {
        // CREATE (POST)
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modalForm),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Creation failed");
        await fetchLeads(passkey);
      }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err: any) {
      alert("Error saving lead: " + err.message);
    }
  };

  // QUICK UPDATE STATUS
  const handleStatusChange = async (id: string, newStatus: WaitlistLead["status"]) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passkey,
          id,
          updates: { status: newStatus },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // DELETE LEAD
  const handleDeleteLead = async (id: string, agencyName: string) => {
    if (!confirm(`Are you sure you want to delete lead "${agencyName}"?`)) return;
    try {
      const res = await fetch(`/api/waitlist?id=${encodeURIComponent(id)}&key=${encodeURIComponent(passkey)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert("Failed to delete lead: " + err.message);
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
      status: lead.status || "NEW",
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
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.whatsapp.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (lead.status || "NEW") === statusFilter;
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
              placeholder="Enter Founder Key (eventos2026)"
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
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="DM_SENT">DM_SENT</option>
                <option value="REPLIED">REPLIED</option>
                <option value="DEMO_SCHEDULED">DEMO_SCHEDULED</option>
                <option value="FOUNDING_MEMBER">FOUNDING_MEMBER</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-[11px] font-semibold">Type:</span>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Types</option>
                <option value="Weddings">Weddings</option>
                <option value="Corporate">Corporate</option>
                <option value="Both">Both</option>
                <option value="Photography">Photography</option>
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
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                      No leads match your search/filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, "");
                    const waText = encodeURIComponent(
                      `Hi ${lead.name}! Lokesh here, Founder of EventOS. Thanks for joining our Founding Private Beta waitlist for ${lead.agencyName} 🚀 I'd love to learn more about your upcoming events!`
                    );

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

                        {/* Editable Pipeline Status Dropdown */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={lead.status || "NEW"}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${
                              STATUS_COLORS[lead.status || "NEW"]
                            }`}
                          >
                            <option value="NEW" className="bg-zinc-900 text-white">NEW</option>
                            <option value="DM_SENT" className="bg-zinc-900 text-white">DM_SENT</option>
                            <option value="REPLIED" className="bg-zinc-900 text-white">REPLIED</option>
                            <option value="DEMO_SCHEDULED" className="bg-zinc-900 text-white">DEMO_SCHEDULED</option>
                            <option value="FOUNDING_MEMBER" className="bg-zinc-900 text-white">FOUNDING_MEMBER</option>
                            <option value="ARCHIVED" className="bg-zinc-900 text-white">ARCHIVED</option>
                          </select>
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
                className="text-zinc-500 hover:text-white text-sm"
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
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors shadow-md shadow-purple-600/20"
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
