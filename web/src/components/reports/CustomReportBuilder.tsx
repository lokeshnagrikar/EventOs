"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Filter,
  Layers,
  Settings,
  Plus,
  Play,
  Share2,
  Lock,
  ChevronDown,
  Calendar,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart as PieIcon,
  AreaChart as AreaIcon,
  CalendarDays,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLine,
  Line,
  PieChart as RechartsPie,
  Pie,
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useToastStore } from "@/lib/toastStore";
import {
  REPORT_SOURCES,
  ReportSource,
  generateCSVContent,
  generateJSONContent,
} from "@/lib/reportsData";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function CustomReportBuilder() {
  const { addToast } = useToastStore();

  // Settings states
  const [selectedSourceId, setSelectedSourceId] = useState("leads");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["name", "eventType", "budget", "status"]);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area">("bar");

  // Advanced Filters
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [minBudget, setMinBudget] = useState("");

  // Share overlay state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("7");
  const [generatedShareLink, setGeneratedShareLink] = useState("");

  // Find active source schema
  const activeSource = useMemo(() => {
    return REPORT_SOURCES.find((s) => s.id === selectedSourceId) || REPORT_SOURCES[0];
  }, [selectedSourceId]);

  // Derived filtered mock data
  const filteredData = useMemo(() => {
    let items = [...activeSource.mockData];

    if (eventTypeFilter !== "ALL") {
      items = items.filter((d) => d.eventType === eventTypeFilter);
    }
    if (statusFilter !== "ALL") {
      items = items.filter((d) => d.status === statusFilter);
    }
    if (minBudget.trim()) {
      const min = parseFloat(minBudget);
      if (!isNaN(min)) {
        items = items.filter((d) => (d.budget || d.amount || 0) >= min);
      }
    }
    return items;
  }, [activeSource, eventTypeFilter, statusFilter, minBudget]);

  // Chart derived dataset
  const chartData = useMemo(() => {
    if (selectedSourceId === "leads" || selectedSourceId === "events") {
      // Group by eventType
      const groups: Record<string, number> = {};
      filteredData.forEach((d) => {
        const type = d.eventType || "Other";
        groups[type] = (groups[type] || 0) + (d.budget || 0);
      });
      return Object.entries(groups).map(([name, value]) => ({ name, value }));
    } else {
      // Invoices grouped by status
      const groups: Record<string, number> = {};
      filteredData.forEach((d) => {
        const status = d.status || "Draft";
        groups[status] = (groups[status] || 0) + (d.amount || 0);
      });
      return Object.entries(groups).map(([name, value]) => ({ name, value }));
    }
  }, [filteredData, selectedSourceId]);

  const toggleColumn = (colKey: string) => {
    if (selectedColumns.includes(colKey)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== colKey));
    } else {
      setSelectedColumns([...selectedColumns, colKey]);
    }
  };

  const handleExport = (format: "csv" | "excel" | "json" | "pdf") => {
    if (format === "pdf") {
      window.print();
      return;
    }

    addToast(`Preparing ${format.toUpperCase()} export batch chunk stream...`, "info");

    setTimeout(() => {
      let content = "";
      let filename = `custom_report_${selectedSourceId}`;
      const columns = activeSource.columns.filter((c) => selectedColumns.includes(c.key));

      if (format === "csv") {
        content = generateCSVContent(columns, filteredData);
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "json") {
        content = generateJSONContent(filteredData);
        const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "excel") {
        content = generateCSVContent(columns, filteredData).replace(/,/g, "\t");
        const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      addToast(`${format.toUpperCase()} Export saved successfully!`, "success");
    }, 1000);
  };

  const generateShareLink = () => {
    const token = Math.random().toString(36).substring(7).toUpperCase();
    setGeneratedShareLink(`https://eventos.dev/share/rep-${token}`);
    addToast("Secure report share link generated!", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── CONTROLS SIDEBAR ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
            <Settings size={13} />
            Configure Custom Report
          </h3>

          {/* Data Source Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Report Data Source</label>
            <select
              value={selectedSourceId}
              onChange={(e) => {
                setSelectedSourceId(e.target.value);
                setSelectedColumns(REPORT_SOURCES.find((s) => s.id === e.target.value)?.columns.map((c) => c.key).slice(0, 4) || []);
              }}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-250 focus:outline-none focus:border-purple-500/30"
            >
              {REPORT_SOURCES.map((src) => (
                <option key={src.id} value={src.id}>{src.name}</option>
              ))}
            </select>
          </div>

          {/* Columns Selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Visible Columns</label>
            <div className="flex flex-wrap gap-1.5">
              {activeSource.columns.map((col) => {
                const active = selectedColumns.includes(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer",
                      active ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                        : "border-zinc-850 bg-zinc-900/60 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    {active && <Check size={9} />}
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Panel */}
          <div className="space-y-3 pt-3 border-t border-zinc-850/50">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-550 tracking-wider">
              <Filter size={10} />
              Filter Rules
            </div>
            
            {/* Event Type Filter (Wedding, Corporate, Birthday) */}
            {(selectedSourceId === "leads" || selectedSourceId === "events") && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-extrabold uppercase text-zinc-600">Event Type</label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-300 focus:outline-none"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="Wedding">Wedding Only</option>
                  <option value="Corporate">Corporate Only</option>
                  <option value="Birthday">Birthday Only</option>
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-extrabold uppercase text-zinc-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {selectedSourceId === "leads" && (
                  <>
                    <option value="WON">Won Leads</option>
                    <option value="NEGOTIATING">Negotiating</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONTACTED">Contacted</option>
                  </>
                )}
                {selectedSourceId === "invoices" && (
                  <>
                    <option value="PAID">Paid Invoices</option>
                    <option value="SENT">Sent</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="DRAFT">Draft</option>
                  </>
                )}
                {selectedSourceId === "events" && (
                  <>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PLANNING">Planning</option>
                  </>
                )}
              </select>
            </div>

            {/* Minimum Budget Limit */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-extrabold uppercase text-zinc-600">Minimum Value (INR)</label>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="Ex. 100000"
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500/30"
              />
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="space-y-2 pt-3 border-t border-zinc-850/50">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Preview Visualization Chart</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { type: "bar" as const, label: "Bar", icon: BarChart3 },
                { type: "line" as const, label: "Line", icon: LineChart },
                { type: "pie" as const, label: "Pie", icon: PieIcon },
                { type: "area" as const, label: "Area", icon: AreaIcon },
              ].map((c) => {
                const active = chartType === c.type;
                const Icon = c.icon;
                return (
                  <button
                    key={c.type}
                    onClick={() => setChartType(c.type)}
                    className={cn(
                      "p-2 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all",
                      active ? "border-purple-500/20 bg-purple-500/5 text-purple-400"
                        : "border-zinc-850 bg-zinc-900/40 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    <Icon size={14} />
                    <span className="text-[8px] font-black uppercase">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Template CTA */}
        <div className="flex gap-2">
          <button
            onClick={() => addToast("Report template successfully saved to favorites ledger.", "success")}
            className="flex-1 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-[0.98]"
          >
            Save Template
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2.5 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      {/* ── VISUALIZATION & PREVIEW TABLE ─────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Dynamic Chart Preview */}
        <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Data Visualization Preview</h3>
            <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Recharts Engine</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #374151", borderRadius: "12px" }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === "line" ? (
                <RechartsLine data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #374151", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                </RechartsLine>
              ) : chartType === "area" ? (
                <RechartsArea data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #374151", borderRadius: "12px" }} />
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#areaColor)" />
                </RechartsArea>
              ) : (
                <RechartsPie>
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #374151", borderRadius: "12px" }} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPie>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Data Preview Table */}
        <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Report data rows ({filteredData.length})</h3>
            
            {/* Quick Export formats */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport("csv")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport("json")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-400 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer"
              >
                PDF / Print
              </button>
            </div>
          </div>

          <div className="border border-zinc-850 rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-550 border-b border-zinc-850/60">
                  <tr>
                    {activeSource.columns.filter((c) => selectedColumns.includes(c.key)).map((col) => (
                      <th key={col.key} className="px-4 py-2">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={selectedColumns.length} className="px-4 py-8 text-center text-zinc-600 font-bold">
                        No rows matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/10 transition-colors">
                        {activeSource.columns.filter((c) => selectedColumns.includes(c.key)).map((col) => {
                          const val = row[col.key];
                          return (
                            <td key={col.key} className="px-4 py-3 font-semibold text-zinc-300">
                              {col.type === "number" && typeof val === "number" ? val.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }) : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ── SECURE SHARE MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Generate Secure Share Link</h3>
                  <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">Encrypt your business report data with password permissions</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1"><Lock size={9} /> Password Protection (Optional)</label>
                  <input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-700 text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider flex items-center gap-1"><Calendar size={9} /> Expire Share Link</label>
                  <select
                    value={shareExpiry}
                    onChange={(e) => setShareExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none"
                  >
                    <option value="1">Expire in 24 hours</option>
                    <option value="7">Expire in 7 days</option>
                    <option value="30">Expire in 30 days</option>
                    <option value="never">Never Expire</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-850/50 flex flex-col gap-2">
                <button
                  onClick={generateShareLink}
                  className="w-full py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Generate encrypted URL
                </button>
                {generatedShareLink && (
                  <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-[10px] font-mono select-all">
                    <span className="truncate text-zinc-400">{generatedShareLink}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedShareLink);
                        addToast("Share URL copied to clipboard!", "success");
                      }}
                      className="text-purple-400 hover:text-white font-bold ml-2 cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setGeneratedShareLink("");
                    setSharePassword("");
                  }}
                  className="w-full py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
