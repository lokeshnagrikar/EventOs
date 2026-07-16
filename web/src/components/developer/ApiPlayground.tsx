"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Copy,
  Check,
  Terminal,
  Code2,
  Cpu,
  Loader2,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { PLAYGROUND_ENDPOINTS, generateSnippet } from "@/lib/developerData";

export default function ApiPlayground() {
  const { addToast } = useToastStore();

  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "js" | "python" | "go">("curl");
  
  // Custom request body state (pre-populated by selected endpoint body)
  const [requestBodyText, setRequestBodyText] = useState(PLAYGROUND_ENDPOINTS[0].requestBody || "");

  // Response execution states
  const [executing, setExecuting] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const activeEndpoint = useMemo(() => {
    const ep = PLAYGROUND_ENDPOINTS[selectedEndpointIndex] || PLAYGROUND_ENDPOINTS[0];
    return ep;
  }, [selectedEndpointIndex]);

  const codeSnippet = useMemo(() => {
    return generateSnippet(selectedLanguage, activeEndpoint.method, activeEndpoint.path, requestBodyText);
  }, [selectedLanguage, activeEndpoint, requestBodyText]);

  const handleEndpointChange = (index: number) => {
    setSelectedEndpointIndex(index);
    setRequestBodyText(PLAYGROUND_ENDPOINTS[index].requestBody || "");
    setResponseCode(null);
    setResponseText("");
  };

  const handleRunRequest = () => {
    setExecuting(true);
    setResponseCode(null);
    setResponseText("");

    setTimeout(() => {
      setResponseCode(activeEndpoint.method === "POST" ? 201 : 200);
      setResponseText(activeEndpoint.responseBody);
      setExecuting(false);
      addToast("Simulated API request executed successfully", "success");
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none text-zinc-300 font-sans">
      
      {/* ── REQUEST EDITOR & CONFIG ───────────────────────────────────────── */}
      <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
          <Terminal size={13} />
          Interactive Request Panel
        </h3>

        {/* Path Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">REST Endpoint</label>
          <select
            value={selectedEndpointIndex}
            onChange={(e) => handleEndpointChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 focus:outline-none"
          >
            {PLAYGROUND_ENDPOINTS.map((ep, idx) => (
              <option key={idx} value={idx}>
                [{ep.method}] {ep.path} — {ep.description}
              </option>
            ))}
          </select>
        </div>

        {/* Snippet Code Language selection */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-850/50">
          <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider">Language snippet</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "curl" as const, label: "cURL" },
              { id: "js" as const, label: "Fetch" },
              { id: "python" as const, label: "Python" },
              { id: "go" as const, label: "Go" },
            ].map((lang) => {
              const active = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={cn(
                    "py-1.5 border rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer",
                    active ? "bg-purple-500/10 border-purple-500/25 text-purple-400 shadow-sm"
                      : "border-zinc-850 bg-zinc-900/40 text-zinc-500 hover:text-zinc-350"
                  )}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[8px] font-black text-zinc-550 uppercase">
            <span>Code snippet preview</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeSnippet);
                addToast("Snippet copied!", "success");
              }}
              className="text-purple-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Copy size={9} /> Copy
            </button>
          </div>
          <pre className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl overflow-x-auto text-[10px] font-mono text-zinc-300 leading-relaxed max-h-36 scrollbar-thin">
            {codeSnippet}
          </pre>
        </div>

        {/* Request JSON Body editor (if POST) */}
        {activeEndpoint.method === "POST" && (
          <div className="space-y-1.5 pt-2 border-t border-zinc-850/50">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Request JSON Payload</label>
            <textarea
              value={requestBodyText}
              onChange={(e) => setRequestBodyText(e.target.value)}
              rows={5}
              className="w-full p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-[10px] font-mono text-zinc-200 focus:outline-none resize-none scrollbar-thin"
            />
          </div>
        )}

        <button
          onClick={handleRunRequest}
          disabled={executing}
          className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1.5"
        >
          {executing ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} />}
          Run Request API
        </button>
      </div>

      {/* ── RESPONSE VIEWER ──────────────────────────────────────────────── */}
      <div className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
              <Cpu size={13} />
              API Output Stream
            </h3>
            
            {responseCode && (
              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider",
                responseCode < 300 ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                  : "bg-red-500/10 text-red-450 border-red-500/20 animate-pulse"
              )}>
                {responseCode} {responseCode === 201 ? "Created" : "OK"}
              </span>
            )}
          </div>

          <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl p-3 min-h-[180px] flex flex-col justify-center">
            {executing ? (
              <div className="text-center py-12 space-y-2">
                <Loader2 size={24} className="animate-spin text-purple-400 mx-auto" />
                <span className="text-[9px] font-black uppercase text-zinc-550">Resolving request...</span>
              </div>
            ) : responseText ? (
              <pre className="text-[10px] font-mono text-zinc-350 leading-relaxed overflow-x-auto scrollbar-thin">
                {responseText}
              </pre>
            ) : (
              <div className="text-center py-12 space-y-1">
                <FileCode size={24} className="text-zinc-800 mx-auto" />
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Click run request to trigger logs output</p>
              </div>
            )}
          </div>
        </div>

        {/* API analytics mini details */}
        <div className="p-3 bg-zinc-900/30 border border-zinc-850/60 rounded-xl text-[9px] font-bold text-zinc-550 uppercase tracking-wider flex justify-between">
          <span>Client SDK: TypeScript v1.2</span>
          <span>Response latency: 120ms</span>
        </div>
      </div>

    </div>
  );
}
