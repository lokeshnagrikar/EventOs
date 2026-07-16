"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  History,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Globe,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { useToastStore } from "@/lib/toastStore";
import { IMPORT_SOURCES, DEMO_DATASETS, ImportHistoryItem } from "@/lib/importData";

// Initial default history ledger
const INITIAL_HISTORY: ImportHistoryItem[] = [
  {
    id: "MIG-9B2F7X1C",
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    fileName: "HoneyBook_Leads_Export_June.csv",
    source: "HoneyBook",
    dataType: "CRM Leads",
    recordsCount: 45,
    skippedCount: 3,
    errorCount: 2,
    durationSeconds: 8,
    status: "completed",
    user: "Roy Wedding Admin",
    impactSummary: { leadsCreated: 45, eventsCreated: 10 },
  },
  {
    id: "MIG-4J7K2L8P",
    date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    fileName: "Old_Events_Ledger_2025.xlsx",
    source: "Excel Spreadsheet",
    dataType: "Events Planner",
    recordsCount: 112,
    skippedCount: 12,
    errorCount: 8,
    durationSeconds: 15,
    status: "completed",
    user: "Roy Wedding Admin",
    impactSummary: { eventsCreated: 112, invoicesCreated: 35 },
  },
  {
    id: "MIG-2H8M3N9Y",
    date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    fileName: "Workspace_Contacts_Notion.json",
    source: "Notion Database",
    dataType: "CRM Leads",
    recordsCount: 30,
    skippedCount: 0,
    errorCount: 0,
    durationSeconds: 4,
    status: "rolled_back",
    user: "Roy Wedding Admin",
    impactSummary: { leadsCreated: 30 },
  },
];

export default function ImportDashboard() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Rollback drawer state
  const [rollbackItem, setRollbackItem] = useState<ImportHistoryItem | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_imports_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory(INITIAL_HISTORY);
      }
    } else {
      setHistory(INITIAL_HISTORY);
      localStorage.setItem("eventos_imports_history", JSON.stringify(INITIAL_HISTORY));
    }
  }, []);

  const triggerRollback = (item: ImportHistoryItem) => {
    setRollbackItem(item);
  };

  const executeRollback = () => {
    if (!rollbackItem) return;
    setIsRollingBack(true);

    setTimeout(() => {
      const updated = history.map((h) => {
        if (h.id === rollbackItem.id) {
          return { ...h, status: "rolled_back" as const };
        }
        return h;
      });

      setHistory(updated);
      localStorage.setItem("eventos_imports_history", JSON.stringify(updated));
      setIsRollingBack(false);
      setRollbackItem(null);
      addToast(`Rollback complete. ${rollbackItem.fileName} records reverted safely.`, "success");
    }, 1200);
  };

  // Select Demo Dataset
  const handleSelectDemo = (demoId: string) => {
    // Navigate directly to wizard with search param pre-loaded
    router.push(`/import/wizard`);
  };

  if (!mounted) return null;

  return (
    <PageShell
      title="Import & Migration Center"
      subtitle="Enterprise workspace data migration portal"
    >
      <div className="space-y-12 pb-12 select-none text-zinc-300">

        {/* ── METRICS OVERVIEW ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">
                  {history.reduce((acc, h) => (h.status === "completed" ? acc + h.recordsCount : acc), 0)}
                </p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Total Records Imported</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database size={14} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">96.8%</p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Average Match Rate</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={14} />
              </div>
            </div>
          </div>

          <div className="p-5 border border-zinc-855 bg-zinc-950/20 backdrop-blur-md rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black text-white">4</p>
                <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Connected Sources</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe size={14} />
              </div>
            </div>
          </div>

          {/* Core Migration trigger button */}
          <button
            onClick={() => router.push("/import/wizard")}
            className="flex flex-col justify-center items-center p-5 border border-purple-500/20 bg-purple-650/10 hover:bg-purple-650/20 rounded-2xl text-center group cursor-pointer transition-all hover:border-purple-500/40 relative overflow-hidden"
          >
            <div className="absolute -top-10 -left-10 h-20 w-20 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
            <Database size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase text-purple-300 tracking-wider mt-2 flex items-center gap-1 group-hover:underline">
              Import New Dataset
              <ArrowRight size={10} />
            </span>
          </button>
        </div>

        {/* ── DEMO IMPORT TEMPLATES ────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Launch Sample Demo Imports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_DATASETS.map((demo) => (
              <div
                key={demo.id}
                className="p-5 rounded-2xl border border-zinc-850 bg-zinc-950/20 hover:border-purple-500/15 hover:bg-zinc-900/10 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <h4 className="text-xs font-extrabold text-zinc-200">{demo.name}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">{demo.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-850/50 pt-3 mt-4">
                  <span className="text-[9px] text-purple-400/60 font-black uppercase font-mono">{demo.rows.length} rows • mapped automatically</span>
                  <button
                    onClick={() => handleSelectDemo(demo.id)}
                    className="flex items-center gap-1 text-[10px] text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Quick Test Import <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MIGRATION HISTORY LEDGER ────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1.5">
            <History size={13} />
            Migration History Logs
          </h3>
          {history.length === 0 ? (
            <EmptyState icon={History} title="No Import History" description="No datasets have been imported to this workspace yet." />
          ) : (
            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-550 border-b border-zinc-850/60">
                    <tr>
                      <th className="px-5 py-3">File Name</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Data Model</th>
                      <th className="px-5 py-3 text-center">Records</th>
                      <th className="px-5 py-3 text-center">Skipped</th>
                      <th className="px-5 py-3 text-center">Errors</th>
                      <th className="px-5 py-3 text-center">Date</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/40">
                    {history.map((item) => {
                      const isCompleted = item.status === "completed";
                      return (
                        <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-zinc-200">
                            <div className="flex flex-col">
                              <span>{item.fileName}</span>
                              <span className="text-[8px] text-zinc-600 font-mono mt-0.5">{item.id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-zinc-400">{item.source}</td>
                          <td className="px-5 py-3.5 font-semibold">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-purple-400">
                              {item.dataType}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-zinc-200">{item.recordsCount}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-zinc-500">{item.skippedCount}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-red-400">{item.errorCount}</td>
                          <td className="px-5 py-3.5 text-center font-semibold text-zinc-500 font-mono text-[10px]">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-wider",
                              isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            )}>
                              {isCompleted ? "Completed" : "Rolled Back"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isCompleted ? (
                              <button
                                onClick={() => triggerRollback(item)}
                                className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Rollback
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-650 font-bold uppercase mr-2">No Action</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── ROLLBACK IMPACT DRAWER / MODAL ──────────────────────────────── */}
        <AnimatePresence>
          {rollbackItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-zinc-200">Execute Rollback / Undo Import</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">This action will safely remove the imported records from database partitions.</p>
                  </div>
                </div>

                <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-red-400 tracking-wider">Estimated Impact Summary</h4>
                  <div className="space-y-1.5 text-xs text-zinc-350">
                    {rollbackItem.impactSummary.leadsCreated && (
                      <p className="font-semibold flex justify-between">
                        <span>CRM Leads Deleted:</span>
                        <span className="text-red-400 font-bold">-{rollbackItem.impactSummary.leadsCreated}</span>
                      </p>
                    )}
                    {rollbackItem.impactSummary.eventsCreated && (
                      <p className="font-semibold flex justify-between">
                        <span>Event Planners Deleted:</span>
                        <span className="text-red-400 font-bold">-{rollbackItem.impactSummary.eventsCreated}</span>
                      </p>
                    )}
                    {rollbackItem.impactSummary.invoicesCreated && (
                      <p className="font-semibold flex justify-between">
                        <span>Finance Invoices Deleted:</span>
                        <span className="text-red-400 font-bold">-{rollbackItem.impactSummary.invoicesCreated}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-zinc-850/50">
                  <button
                    onClick={() => setRollbackItem(null)}
                    disabled={isRollingBack}
                    className="px-4 py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeRollback}
                    disabled={isRollingBack}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-900/20 disabled:opacity-50"
                  >
                    {isRollingBack && <RefreshCw size={12} className="animate-spin" />}
                    {isRollingBack ? "Undoing..." : "Confirm Rollback"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
