"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bug,
  Upload,
  Send,
  AlertCircle,
  Activity,
  Monitor,
  Terminal,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import { useToastStore } from "@/lib/toastStore";

interface Telemetry {
  browser: string;
  os: string;
  viewportWidth: number;
  viewportHeight: number;
  appVersion: string;
  userId: string;
  workspaceId: string;
  timestamp: string;
}

const MOCK_CONSOLE_LOGS = [
  { type: "info", source: "SocketService", msg: "Attempting connection to WS gateway..." },
  { type: "info", source: "SocketService", msg: "WS Connected. Active namespace /client-session." },
  { type: "error", source: "GalleryUpload", msg: "Cloudinary upload failed: API Key invalid configuration status 403" },
  { type: "warning", source: "Actuator", msg: "Health check response time took 450ms. SLA Warning thresholds exceeded." },
];

export default function BugReporterPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Screenshot Annotation selector
  const [annotationBox, setAnnotationBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    // Detect OS & Browser details on client mount
    const userAgent = window.navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";

    setTelemetry({
      browser,
      os,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      appVersion: "v1.2.4",
      userId: "USR-998A7B",
      workspaceId: "WRK-DREAMWEDDINGS",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshot(reader.result as string);
        setAnnotationBox({ x: 20, y: 30, w: 120, h: 80 }); // Default mock annotation box
        addToast("Screenshot successfully loaded. Drag annotation boxes to highlight issues.", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Save bug to tickets storage
      const stored = localStorage.getItem("eventos_support_tickets");
      const current = stored ? JSON.parse(stored) : [];

      const newBug = {
        id: `BUG-${Date.now().toString(36).toUpperCase()}`,
        subject: `[Bug] ${title}`,
        category: "technical",
        priority: "high",
        description: `Description: ${description}\n\nSteps to reproduce: ${steps}\n\nTelemetry: ${JSON.stringify(telemetry)}`,
        status: "open",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("eventos_support_tickets", JSON.stringify([newBug, ...current]));
      setTitle("");
      setDescription("");
      setSteps("");
      setScreenshot(null);
      setAnnotationBox(null);
      setIsSubmitting(false);
      addToast("Bug reported successfully with telemetry metadata!", "success");
      router.push("/help/support");
    }, 1000);
  };

  return (
    <PageShell
      title="Advanced Bug Reporter"
      subtitle="Report errors, attach annotated screenshots, and automatically include client telemetry data."
      breadcrumbs={[{ label: "Help Center", href: "/help" }, { label: "Bug Report" }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 select-none text-zinc-300 max-w-5xl mx-auto pb-12">
        
        {/* ── BUG REPORT FORM ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmitBug} className="p-6 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-5">
            <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
              <Bug size={13} />
              Report System Issue
            </h3>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Bug Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Gallery upload fails on large JPEG image files"
                required
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Describe the issue</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what was expected, and what actually occurred..."
                required
                rows={4}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Steps to Reproduce</label>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Navigate to Gallery tab&#10;2. Click Upload button&#10;3. Select 15MB file..."
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none resize-none"
              />
            </div>

            {/* Screenshot & Annotations */}
            <div className="space-y-3 pt-3 border-t border-zinc-850/50">
              <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Screenshot Annotation</label>
              
              {screenshot ? (
                <div className="relative border border-zinc-850 rounded-xl overflow-hidden max-w-sm bg-zinc-900">
                  <img src={screenshot} alt="Annotation Preview" className="w-full h-auto" />
                  
                  {/* Mock Annotation Box overlay */}
                  {annotationBox && (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/10 cursor-move"
                      style={{
                        left: `${annotationBox.x}%`,
                        top: `${annotationBox.y}%`,
                        width: `${annotationBox.w}px`,
                        height: `${annotationBox.h}px`,
                      }}
                      title="Issue Area Highlighted"
                    >
                      <span className="absolute -top-5 left-0 bg-red-500 text-white text-[8px] font-black uppercase px-1 rounded-sm">BUG AREA</span>
                    </div>
                  )}

                  <button
                    onClick={() => { setScreenshot(null); setAnnotationBox(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-700 transition-colors relative">
                  <Upload size={24} className="mx-auto text-zinc-750" />
                  <p className="text-[10px] text-zinc-500 font-bold mt-1">Upload screenshot to annotate</p>
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
              Submit Bug Report
            </button>
          </form>
        </div>

        {/* ── CLIENT TELEMETRY & CONSOLE LOGS ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Telemetry card */}
          {telemetry && (
            <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
                <Monitor size={12} className="text-purple-400" />
                Automatic Telemetry Capture
              </h4>

              <div className="space-y-2 text-xs font-semibold text-zinc-450">
                <div className="flex justify-between">
                  <span>Operating System:</span>
                  <span className="text-zinc-300 font-mono text-[10px]">{telemetry.os}</span>
                </div>
                <div className="flex justify-between">
                  <span>Browser Engine:</span>
                  <span className="text-zinc-300 font-mono text-[10px]">{telemetry.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span>Viewport Dimension:</span>
                  <span className="text-zinc-300 font-mono text-[10px]">{telemetry.viewportWidth} × {telemetry.viewportHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span>Application Version:</span>
                  <span className="text-zinc-300 font-mono text-[10px]">{telemetry.appVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workspace Coordinates:</span>
                  <span className="text-zinc-300 font-mono text-[10px]">{telemetry.workspaceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp Index:</span>
                  <span className="text-zinc-350 font-mono text-[9px]">{new Date(telemetry.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Console / Network Logs */}
          <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black uppercase text-zinc-200 tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-purple-400" />
              Simulated Console Warnings
            </h4>

            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
              {MOCK_CONSOLE_LOGS.map((log, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-[10px] space-y-1 font-mono">
                  <div className="flex justify-between items-center text-[8px] font-bold text-zinc-550 uppercase">
                    <span className={cn(log.type === "error" ? "text-red-400" : log.type === "warning" ? "text-amber-400" : "text-zinc-500")}>
                      [{log.type}] {log.source}
                    </span>
                  </div>
                  <p className="text-zinc-350 leading-relaxed break-words">{log.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
