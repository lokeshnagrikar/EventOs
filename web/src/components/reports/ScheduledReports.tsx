"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Trash2,
  Mail,
  Clock,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  FileText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { SCHEDULED_REPORTS_INITIAL, ScheduledReportItem } from "@/lib/reportsData";

export default function ScheduledReports() {
  const { addToast } = useToastStore();
  const [schedules, setSchedules] = useState<ScheduledReportItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<any>("Weekly");
  const [format, setFormat] = useState<any>("PDF");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_scheduled_reports");
    if (stored) {
      try {
        setSchedules(JSON.parse(stored));
      } catch {
        setSchedules(SCHEDULED_REPORTS_INITIAL);
      }
    } else {
      setSchedules(SCHEDULED_REPORTS_INITIAL);
      localStorage.setItem("eventos_scheduled_reports", JSON.stringify(SCHEDULED_REPORTS_INITIAL));
    }
  }, []);

  const saveSchedules = (updated: ScheduledReportItem[]) => {
    setSchedules(updated);
    localStorage.setItem("eventos_scheduled_reports", JSON.stringify(updated));
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientInput.trim() || !recipientInput.includes("@")) {
      addToast("Please enter a valid email address.", "info");
      return;
    }
    if (recipients.includes(recipientInput.trim())) {
      addToast("Recipient already added.", "info");
      return;
    }
    setRecipients([...recipients, recipientInput.trim()]);
    setRecipientInput("");
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Please enter a report name.", "info");
      return;
    }
    if (recipients.length === 0) {
      addToast("Please add at least one recipient email.", "info");
      return;
    }

    const newSchedule: ScheduledReportItem = {
      id: `SCH-${Date.now().toString(36).toUpperCase()}`,
      name,
      frequency,
      format,
      recipients,
      lastSent: "Never",
      nextSent: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      active: true,
    };

    saveSchedules([...schedules, newSchedule]);
    setName("");
    setRecipients([]);
    addToast("Report delivery schedule configured successfully!", "success");
  };

  const toggleScheduleActive = (id: string) => {
    const updated = schedules.map((s) => {
      if (s.id === id) {
        return { ...s, active: !s.active };
      }
      return s;
    });
    saveSchedules(updated);
    addToast("Schedule settings updated.", "success");
  };

  const handleDeleteSchedule = (id: string) => {
    saveSchedules(schedules.filter((s) => s.id !== id));
    addToast("Report schedule removed.", "success");
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── CREATE SCHEDULE FORM ────────────────────────────────────────── */}
      <div className="space-y-6">
        <form onSubmit={handleCreateSchedule} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
            <CalendarDays size={13} />
            Schedule Auto-Reporting
          </h3>

          {/* Report Name */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Report Name / Description</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Monthly Financial Statement Overview"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">File Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none"
              >
                <option value="PDF">PDF Document</option>
                <option value="Excel">Excel Sheet</option>
                <option value="CSV">CSV Data</option>
                <option value="JSON">JSON Stream</option>
              </select>
            </div>
          </div>

          {/* Recipients Email List */}
          <div className="space-y-2 pt-2 border-t border-zinc-850/50">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Email Recipients</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="Ex. cfo@agency.com"
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* List of current emails */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold"
                  >
                    <Mail size={10} />
                    {email}
                    <button type="button" onClick={() => handleRemoveRecipient(email)} className="text-purple-300 hover:text-white cursor-pointer font-bold font-mono">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-[0.98] pt-2 flex items-center justify-center gap-1.5"
          >
            <Clock size={13} />
            Configure Schedule
          </button>
        </form>
      </div>

      {/* ── SCHEDULES LIST ────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Active schedules</h3>
        {schedules.length === 0 ? (
          <div className="p-12 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center space-y-2">
            <CalendarDays size={32} className="mx-auto text-zinc-700" />
            <p className="text-xs text-zinc-500 font-bold">No active reporting schedules found.</p>
          </div>
        ) : (
          <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 divide-y divide-zinc-850/50 overflow-hidden">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-5 flex items-center justify-between gap-6 group hover:bg-zinc-900/10 transition-colors">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold text-zinc-200 group-hover:text-white truncate">{schedule.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-purple-400">
                      {schedule.frequency}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-blue-400">
                      {schedule.format}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-zinc-550 font-semibold">
                    <span className="flex items-center gap-1"><Clock size={9} /> Next run: {schedule.nextSent === "Never" ? "Disabled" : new Date(schedule.nextSent).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Mail size={9} /> {schedule.recipients.length} recipients</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Toggle Active Switch */}
                  <button onClick={() => toggleScheduleActive(schedule.id)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                    {schedule.active ? (
                      <ToggleRight size={22} className="text-purple-400" />
                    ) : (
                      <ToggleLeft size={22} className="text-zinc-650" />
                    )}
                  </button>

                  <button onClick={() => handleDeleteSchedule(schedule.id)} className="text-zinc-700 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
