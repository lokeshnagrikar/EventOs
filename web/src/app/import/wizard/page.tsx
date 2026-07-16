"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Database,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
  RefreshCw,
  Play,
  Settings,
  Layers,
  Globe,
  FileSpreadsheet,
  FileText,
  BookOpen,
  Compass,
  Shield,
  Activity,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";
import {
  IMPORT_SOURCES,
  DATA_TYPES,
  DEMO_DATASETS,
  ImportSource,
  DataType,
  DemoDataset,
  SchemaField,
} from "@/lib/importData";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  FileSpreadsheet,
  Globe,
  BookOpen,
  Compass,
  Shield,
  Layers,
  Sparkles,
};

export default function ImportWizard() {
  const router = useRouter();
  const { addToast } = useToastStore();

  // Wizard state machine
  const [step, setStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [selectedType, setSelectedType] = useState<DataType | null>(null);

  // File states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cloudUrl, setCloudUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Demo selection
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  // Mapping state
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Validation / Preview state
  const [duplicateRule, setDuplicateRule] = useState<"skip" | "merge" | "overwrite" | "new">("merge");
  const [editedRows, setEditedRows] = useState<Record<string, string>[]>([]);
  const [issuesFilter, setIssuesFilter] = useState<"all" | "errors" | "warnings">("all");

  // Execution Simulator state
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState({ completed: 0, failed: 0, speed: 0 });

  // Load selected demo dataset details
  const activeDemo = useMemo(() => {
    return DEMO_DATASETS.find((d) => d.id === activeDemoId) || null;
  }, [activeDemoId]);

  // Derived headers and rows based on source (file or demo)
  const currentHeaders = useMemo(() => {
    if (activeDemo) return activeDemo.headers;
    if (uploadedFile) {
      // Mock parsing custom file headers
      return ["Client Name", "Email Address", "Phone Number", "Date of Wedding", "Estimated Budget", "Internal Notes"];
    }
    return [];
  }, [activeDemo, uploadedFile]);

  const currentRows = useMemo(() => {
    if (activeDemo) return activeDemo.rows;
    if (uploadedFile) {
      return [
        { "Client Name": "John Doe", "Email Address": "john.doe@gmail.com", "Phone Number": "555-1212", "Date of Wedding": "2026-11-20", "Estimated Budget": "40000", "Internal Notes": "Referred by past client" },
        { "Client Name": "Sarah Connor", "Email Address": "sconnor@skynet.com", "Phone Number": "555-0921", "Date of Wedding": "2026-10-12", "Estimated Budget": "15000", "Internal Notes": "Needs quote quickly" },
        { "Client Name": "Invalid Budget Row", "Email Address": "invalid@budget.com", "Phone Number": "555-4040", "Date of Wedding": "2026-09-18", "Estimated Budget": "xyz", "Internal Notes": "Test budget validation warning" },
        { "Client Name": "", "Email Address": "missingname@gmail.com", "Phone Number": "555-3030", "Date of Wedding": "2026-08-05", "Estimated Budget": "20000", "Internal Notes": "Test missing required field error" },
      ];
    }
    return [];
  }, [activeDemo, uploadedFile]);

  // Derived validation issues
  const currentIssues = useMemo(() => {
    if (activeDemo) return activeDemo.validationReport.issues;
    if (uploadedFile) {
      return [
        { rowIdx: 2, colHeader: "Estimated Budget", type: "warning" as const, message: "Value 'xyz' is not a valid number. Defaulting to 0.", value: "xyz" },
        { rowIdx: 3, colHeader: "Client Name", type: "error" as const, message: "Required field 'Client Name' is missing.", value: "" },
      ];
    }
    return [];
  }, [activeDemo, uploadedFile]);

  // Sync initial mapping recommendations
  useEffect(() => {
    if (activeDemo) {
      setMappings(activeDemo.suggestedMapping);
    } else if (uploadedFile && selectedType) {
      // Suggest custom file headers mapping
      const suggestions: Record<string, string> = {
        "Client Name": "name",
        "Email Address": "email",
        "Phone Number": "phone",
        "Date of Wedding": "eventDate",
        "Estimated Budget": "budget",
        "Internal Notes": "notes",
      };
      setMappings(suggestions);
    }
  }, [activeDemo, uploadedFile, selectedType]);

  // Wizard Navigation
  const handleNext = () => {
    if (step === 1 && (!selectedSource || !selectedType)) {
      addToast("Please select a data source and target data model to continue.", "info");
      return;
    }
    if (step === 2 && !uploadedFile && !activeDemoId && !cloudUrl) {
      addToast("Please upload a file, input a cloud URL, or select a demo dataset to continue.", "info");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validExtensions = [".csv", ".xlsx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      addToast("Invalid file format. Please upload a .csv or .xlsx file.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast("File size exceeds 10MB limit.", "error");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setUploadedFile(file);
      setActiveDemoId(null);
      setIsUploading(false);
      addToast(`File ${file.name} successfully parsed!`, "success");
    }, 1000);
  };

  // Select Demo Dataset
  const handleSelectDemo = (demoId: string) => {
    const demo = DEMO_DATASETS.find((d) => d.id === demoId);
    if (!demo) return;
    setActiveDemoId(demoId);
    setUploadedFile(null);
    setCloudUrl("");

    // Sync source and type for demo
    const sourceObj = IMPORT_SOURCES.find((s) => s.id === "csv") || null;
    const typeObj = DATA_TYPES.find((t) => t.id === demo.dataType) || null;
    setSelectedSource(sourceObj);
    setSelectedType(typeObj);
  };

  // Run Import Simulator
  const handleStartImport = () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportStats({ completed: 0, failed: 0, speed: 120 });

    const totalRows = currentRows.length;
    const interval = setInterval(() => {
      setImportProgress((p) => {
        const next = p + Math.ceil(100 / totalRows);
        if (next >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          addToast("Data migration completed successfully!", "success");

          // Save mock import to history
          const savedHistory = JSON.parse(localStorage.getItem("eventos_imports_history") || "[]");
          const record: any = {
            id: `MIG-${Date.now().toString(36).toUpperCase()}`,
            date: new Date().toISOString(),
            fileName: activeDemo ? activeDemo.name : uploadedFile?.name || "Cloud Stream",
            source: selectedSource?.name || "Google Sheets",
            dataType: selectedType?.name || "CRM Leads",
            recordsCount: currentRows.length - (activeDemo?.validationReport.errorCount || 1),
            skippedCount: 1,
            errorCount: activeDemo ? activeDemo.validationReport.errorCount : 1,
            durationSeconds: 4,
            status: "completed",
            user: "Roy Wedding Admin",
            impactSummary: {
              leadsCreated: selectedType?.id === "leads" ? currentRows.length - 1 : 0,
              eventsCreated: selectedType?.id === "events" ? currentRows.length - 1 : 0,
              invoicesCreated: selectedType?.id === "invoices" ? currentRows.length - 1 : 0,
            },
          };
          localStorage.setItem("eventos_imports_history", JSON.stringify([record, ...savedHistory]));

          // Redirect to wizard summary card or page
          setStep(5);
          return 100;
        }
        return next;
      });

      setImportStats((stats) => {
        const nextCompleted = stats.completed + 1;
        const isFailed = Math.random() < 0.15; // mock failures
        return {
          completed: nextCompleted,
          failed: isFailed ? stats.failed + 1 : stats.failed,
          speed: Math.floor(Math.random() * 40) + 100,
        };
      });
    }, 800);
  };

  return (
    <PageShell
      title="Import & Migration Center"
      subtitle="Migrate spreadsheets, HoneyBook, or competing CRMs into EventOS"
      breadcrumbs={[{ label: "Import Center", href: "/import" }, { label: "Wizard" }]}
    >
      <div className="space-y-6 select-none text-zinc-300 max-w-5xl mx-auto pb-12">
        {/* Wizard Progression Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/20 border border-zinc-850 rounded-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <React.Fragment key={s}>
              {s > 1 && <div className={cn("flex-1 h-[2px]", step >= s ? "bg-purple-500" : "bg-zinc-800")} />}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all",
                  step === s ? "bg-purple-650 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : step > s ? "bg-purple-950/50 border-purple-800 text-purple-400"
                    : "bg-zinc-950/20 border-zinc-850 text-zinc-550"
                )}>
                  {s}
                </div>
                <span className={cn(
                  "hidden md:inline text-[10px] font-black uppercase tracking-wider",
                  step === s ? "text-zinc-200" : step > s ? "text-purple-400" : "text-zinc-650"
                )}>
                  {s === 1 ? "Configure" : s === 2 ? "Upload" : s === 3 ? "Map Fields" : s === 4 ? "Validate" : "Import"}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: CONFIGURE SOURCE & TYPE ──────────────────────────────── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Step 1: Choose Import Source Platform</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {IMPORT_SOURCES.map((src) => {
                  const Icon = ICON_MAP[src.icon] || Database;
                  const isSelected = selectedSource?.id === src.id;
                  return (
                    <button
                      key={src.id}
                      onClick={() => { setSelectedSource(src); setActiveDemoId(null); }}
                      className={cn(
                        "text-left p-5 rounded-2xl border transition-all cursor-pointer group",
                        isSelected ? "border-purple-500/25 bg-purple-500/5" : "border-zinc-850 bg-zinc-950/20 hover:border-zinc-700"
                      )}
                    >
                      <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-md mb-4", src.color)}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <p className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{src.name}</p>
                      <p className="text-[9px] text-zinc-550 font-semibold leading-relaxed mt-1">{src.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Target Data Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DATA_TYPES.map((type) => {
                  const isSelected = selectedType?.id === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedType(type); setActiveDemoId(null); }}
                      className={cn(
                        "text-left p-5 rounded-2xl border transition-all cursor-pointer group",
                        isSelected ? "border-purple-500/25 bg-purple-500/5" : "border-zinc-850 bg-zinc-950/20 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center border", isSelected ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-zinc-900 border-zinc-800 text-zinc-550")}>
                          <Database size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-200 group-hover:text-white">{type.name}</p>
                          <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">{type.schemaFields.length} columns expected</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-relaxed font-semibold mt-3">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Dataset trigger */}
            <div className="p-5 border border-purple-500/15 bg-purple-500/5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <h4 className="text-xs font-extrabold text-purple-300">Need sample files to test first?</h4>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">Select one of our preset datasets optimized for EventOS. This skips step 1 & 2 configuration settings.</p>
              <div className="flex gap-2">
                {DEMO_DATASETS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => { handleSelectDemo(demo.id); setStep(3); }}
                    className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Load {demo.name.split(" ")[0]} Dataset
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: UPLOAD FILE ─────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h3 className="text-xs font-black uppercase text-zinc-555 tracking-wider">Step 2: Upload migration document</h3>

            {selectedSource?.requiresFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 text-center space-y-4 transition-all relative overflow-hidden",
                  dragActive ? "border-purple-500 bg-purple-500/5" : "border-zinc-800 bg-zinc-950/20 hover:border-zinc-700"
                )}
              >
                {isUploading ? (
                  <div className="space-y-3">
                    <Loader2 size={32} className="animate-spin mx-auto text-purple-400" />
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Parsing spreadsheet headers...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="space-y-3">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-200">{uploadedFile.name}</p>
                      <p className="text-[9px] text-zinc-550 font-semibold uppercase font-mono">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="px-3 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={32} className="mx-auto text-zinc-750 group-hover:text-purple-400" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-200">Drag & drop your CSV or Excel file here</p>
                      <p className="text-[9px] text-zinc-550 font-semibold">Supports .csv, .xlsx up to 10MB</p>
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 hover:bg-zinc-850/60 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all">
                        Browse Files
                        <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 border border-zinc-850 rounded-2xl bg-zinc-950/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-200">Cloud Sync Platform Connect</h4>
                    <p className="text-[9px] text-zinc-550 font-semibold">Enter your cloud database link or credentials to fetch schemas</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-550 tracking-wider">Cloud Share Link / URL</label>
                  <input
                    type="url"
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-500/30 font-semibold"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 3: COLUMN FIELD MAPPING ────────────────────────────────── */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-555 tracking-wider">Step 3: Column field mapping</h3>
                <p className="text-[9px] text-zinc-550 font-semibold mt-1">Match column headers from your file to the EventOS schema properties.</p>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-[8px] font-black text-purple-400 uppercase tracking-wider">
                {selectedType?.name} Model
              </span>
            </div>

            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden divide-y divide-zinc-850/60">
              <div className="grid grid-cols-3 px-5 py-3 bg-zinc-950/40 text-[10px] font-black uppercase tracking-wider text-zinc-550">
                <span>Spreadsheet Column</span>
                <span>EventOS Schema Field</span>
                <span className="text-right">Match Confidence</span>
              </div>

              {currentHeaders.map((header) => {
                const mappedKey = mappings[header] || "";
                const isMapped = mappedKey !== "";
                const matchedField = selectedType?.schemaFields.find((f) => f.key === mappedKey);
                
                // Mock confidence scores
                const confidence = mappedKey ? (header.toLowerCase() === matchedField?.label.toLowerCase() ? 100 : 88) : 0;

                return (
                  <div key={header} className="grid grid-cols-3 px-5 py-3.5 items-center">
                    <span className="text-xs font-bold text-zinc-200">{header}</span>
                    <div>
                      <select
                        value={mappedKey}
                        onChange={(e) => setMappings({ ...mappings, [header]: e.target.value })}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-semibold text-zinc-300 focus:outline-none focus:border-purple-500/30 min-w-[160px]"
                      >
                        <option value="">-- Ignored / Skip --</option>
                        {selectedType?.schemaFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label} {field.required ? "*" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-right">
                      {isMapped ? (
                        <>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            confidence === 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                          )}>
                            {confidence}% MATCH
                          </span>
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        </>
                      ) : (
                        <span className="text-[9px] text-zinc-650 font-bold uppercase">Skipped</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: DATA VALIDATION & SMART PREVIEW ─────────────────────── */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-555 tracking-wider">Step 4: Smart validation & preview</h3>
                <p className="text-[9px] text-zinc-550 font-semibold mt-1">Review validation results before executing the final import into EventOS.</p>
              </div>

              {/* Duplicate Rules Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Duplicate Resolution:</span>
                <select
                  value={duplicateRule}
                  onChange={(e) => setDuplicateRule(e.target.value as any)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-wider text-zinc-300 focus:outline-none focus:border-purple-500/30"
                >
                  <option value="merge">Merge & Combine</option>
                  <option value="overwrite">Overwrite Target</option>
                  <option value="skip">Skip Duplicate</option>
                  <option value="new">Create New (Allow Dupes)</option>
                </select>
              </div>
            </div>

            {/* Validation Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center">
                <p className="text-lg font-black text-zinc-200">{currentRows.length}</p>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Total Rows Detected</p>
              </div>
              <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center">
                <p className="text-lg font-black text-amber-400">
                  {currentIssues.filter((i) => i.type === "warning").length}
                </p>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Warnings Found</p>
              </div>
              <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center">
                <p className="text-lg font-black text-red-400">
                  {currentIssues.filter((i) => i.type === "error").length}
                </p>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Validation Errors</p>
              </div>
              <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center">
                <p className="text-lg font-black text-purple-400">
                  {activeDemo?.validationReport.duplicateCount || 1}
                </p>
                <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider mt-1">Duplicates Detected</p>
              </div>
            </div>

            {/* Spreadsheet Table Preview */}
            <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
              <div className="overflow-x-auto max-h-[300px] scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-zinc-950 text-[9px] font-black uppercase tracking-wider text-zinc-550 border-b border-zinc-850/60">
                    <tr>
                      <th className="px-4 py-2 text-center w-12">Row</th>
                      {currentHeaders.map((h) => (
                        <th key={h} className="px-4 py-2 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/40">
                    {currentRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="px-4 py-3 text-center text-zinc-600 font-mono font-bold border-r border-zinc-850/40">{rIdx + 1}</td>
                        {currentHeaders.map((h) => {
                          const val = row[h];
                          const issue = currentIssues.find((i) => i.rowIdx === rIdx && i.colHeader === h);
                          return (
                            <td
                              key={h}
                              className={cn(
                                "px-4 py-3 font-semibold",
                                issue?.type === "error" && "bg-red-500/5 text-red-300 border-red-500/20 border",
                                issue?.type === "warning" && "bg-amber-500/5 text-amber-300 border-amber-500/20 border"
                              )}
                              title={issue?.message}
                            >
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className="truncate">{val || <span className="text-zinc-700 italic">empty</span>}</span>
                                {issue && (
                                  <AlertCircle
                                    size={12}
                                    className={cn("shrink-0", issue.type === "error" ? "text-red-400" : "text-amber-400")}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation issues ledger */}
            {currentIssues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-zinc-550 tracking-wider">Validation Errors & Warnings Log</h4>
                <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden divide-y divide-zinc-850/50">
                  {currentIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 text-xs">
                      <AlertCircle size={14} className={cn("shrink-0 mt-0.5", issue.type === "error" ? "text-red-400" : "text-amber-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-200">
                          Row {issue.rowIdx + 1} • Column &quot;{issue.colHeader}&quot;:{" "}
                          <span className={issue.type === "error" ? "text-red-400" : "text-amber-400"}>{issue.message}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 5: MIGRATION PROGRESS / SUMMARY ────────────────────────── */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-xl mx-auto text-center py-10">
            {isImporting ? (
              <div className="p-8 border border-zinc-850 bg-zinc-950/20 rounded-3xl space-y-6">
                <Loader2 size={36} className="animate-spin mx-auto text-purple-400" />
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-zinc-200">Migration Pipeline Running</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">Processing batch stream into EventOS workspace ledger. Please keep this tab active or run in background.</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <span>PROGRESS</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-tr from-purple-500 to-pink-500 h-full rounded-full"
                      animate={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-zinc-850/50 pt-4">
                  <div>
                    <p className="text-base font-extrabold text-zinc-200">{importStats.completed}</p>
                    <p className="text-[8px] text-zinc-650 font-black uppercase">Processed</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-red-400">{importStats.failed}</p>
                    <p className="text-[8px] text-zinc-650 font-black uppercase">Errors</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-purple-400">{importStats.speed} /s</p>
                    <p className="text-[8px] text-zinc-650 font-black uppercase">Record Rate</p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      addToast("Import is running in the background. We will notify you when done.", "info");
                      router.push("/import");
                    }}
                    className="px-4 py-2 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Run in Background
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-zinc-850 bg-zinc-950/20 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />

                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">Migration Complete!</h3>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed">Your data has been processed, validated, and safely committed to tenant database partitions.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/30 p-4 border border-zinc-850 rounded-2xl">
                  <div>
                    <p className="text-lg font-black text-zinc-200">{currentRows.length - 1}</p>
                    <p className="text-[8px] text-zinc-550 font-black uppercase mt-1">Imported</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-amber-400">1</p>
                    <p className="text-[8px] text-zinc-550 font-black uppercase mt-1">Duplicates</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-red-400">1</p>
                    <p className="text-[8px] text-zinc-550 font-black uppercase mt-1">Skipped Errors</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-emerald-400">92%</p>
                    <p className="text-[8px] text-zinc-550 font-black uppercase mt-1">Success Uptime</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => router.push(selectedType?.id === "leads" ? "/crm" : "/events")}
                    className="flex items-center gap-1 px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                  >
                    Go to Workspace Dashboard
                    <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => router.push("/import")}
                    className="px-5 py-2.5 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    View History Ledger
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation Action Buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between border-t border-zinc-850/50 pt-4">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-850 bg-zinc-900/60 text-zinc-400 hover:text-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step === 4 ? (
              <button
                onClick={handleStartImport}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg shadow-purple-500/10"
              >
                Execute Import <Play size={10} fill="white" className="ml-0.5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg shadow-purple-500/10"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
