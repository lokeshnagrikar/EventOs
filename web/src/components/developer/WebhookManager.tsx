"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import {
  INITIAL_WEBHOOK_ENDPOINTS,
  INITIAL_WEBHOOK_LOGS,
  WebhookEndpointItem,
  WebhookLogItem,
} from "@/lib/developerData";

const AVAILABLE_EVENTS = [
  "lead.created",
  "lead.updated",
  "quote.created",
  "quote.accepted",
  "booking.created",
  "event.updated",
  "payment.received",
  "invoice.paid",
  "gallery.shared",
  "user.invited",
];

export default function WebhookManager() {
  const { addToast } = useToastStore();
  const [endpoints, setEndpoints] = useState<WebhookEndpointItem[]>([]);
  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [urlInput, setUrlInput] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead.created", "invoice.paid"]);

  // Expanded Log payload view
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedEndpoints = localStorage.getItem("eventos_developer_endpoints");
    const storedLogs = localStorage.getItem("eventos_developer_webhook_logs");

    if (storedEndpoints) {
      try { setEndpoints(JSON.parse(storedEndpoints)); } catch { setEndpoints(INITIAL_WEBHOOK_ENDPOINTS); }
    } else {
      setEndpoints(INITIAL_WEBHOOK_ENDPOINTS);
      localStorage.setItem("eventos_developer_endpoints", JSON.stringify(INITIAL_WEBHOOK_ENDPOINTS));
    }

    if (storedLogs) {
      try { setLogs(JSON.parse(storedLogs)); } catch { setLogs(INITIAL_WEBHOOK_LOGS); }
    } else {
      setLogs(INITIAL_WEBHOOK_LOGS);
      localStorage.setItem("eventos_developer_webhook_logs", JSON.stringify(INITIAL_WEBHOOK_LOGS));
    }
  }, []);

  const saveEndpoints = (updated: WebhookEndpointItem[]) => {
    setEndpoints(updated);
    localStorage.setItem("eventos_developer_endpoints", JSON.stringify(updated));
  };

  const saveLogs = (updated: WebhookLogItem[]) => {
    setLogs(updated);
    localStorage.setItem("eventos_developer_webhook_logs", JSON.stringify(updated));
  };

  const handleToggleEvent = (evt: string) => {
    if (selectedEvents.includes(evt)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== evt));
    } else {
      setSelectedEvents([...selectedEvents, evt]);
    }
  };

  const handleAddEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !urlInput.startsWith("http")) {
      addToast("Please enter a valid HTTP/HTTPS endpoint URL.", "info");
      return;
    }
    if (selectedEvents.length === 0) {
      addToast("Please select at least one event type trigger.", "info");
      return;
    }

    const secret = `whsec_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newEndpoint: WebhookEndpointItem = {
      id: `wh-${Date.now().toString(36).toUpperCase()}`,
      url: urlInput,
      secret,
      events: selectedEvents,
      active: true,
      createdAt: new Date().toISOString(),
    };

    saveEndpoints([...endpoints, newEndpoint]);
    setUrlInput("");
    addToast("Webhook endpoint registered successfully!", "success");
  };

  const handleToggleActive = (id: string) => {
    const updated = endpoints.map((ep) => {
      if (ep.id === id) {
        return { ...ep, active: !ep.active };
      }
      return ep;
    });
    saveEndpoints(updated);
    addToast("Endpoint status updated.", "success");
  };

  const handleDeleteEndpoint = (id: string) => {
    saveEndpoints(endpoints.filter((ep) => ep.id !== id));
    addToast("Endpoint removed.", "success");
  };

  const handleReplayLog = (log: WebhookLogItem) => {
    addToast(`Replaying event ${log.event} to ${log.endpointUrl}...`, "info");
    
    setTimeout(() => {
      const replayedLog: WebhookLogItem = {
        id: `evt_replay_${Date.now()}`,
        endpointUrl: log.endpointUrl,
        event: log.event,
        statusCode: 200,
        latencyMs: 110,
        retries: 0,
        timestamp: new Date().toISOString(),
        payload: log.payload,
        responseBody: JSON.stringify({ status: "ok", replay: true }, null, 2),
      };

      saveLogs([replayedLog, ...logs]);
      addToast("Webhook replayed successfully (Status: 200 OK)", "success");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── ADD WEBHOOK ENDPOINT FORM ────────────────────────────────────── */}
      <div className="space-y-6">
        <form onSubmit={handleAddEndpoint} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
            <Globe size={13} />
            Add Webhook Endpoint
          </h3>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Endpoint URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Ex. https://api.yourstudio.com/hooks"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Checklist events */}
          <div className="space-y-2 pt-2 border-t border-zinc-850/50">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Select Webhook Events</label>
            
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {AVAILABLE_EVENTS.map((evt) => {
                const active = selectedEvents.includes(evt);
                return (
                  <button
                    key={evt}
                    type="button"
                    onClick={() => handleToggleEvent(evt)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-between cursor-pointer",
                      active ? "bg-purple-500/5 border-purple-500/15 text-purple-400"
                        : "border-zinc-850/60 bg-zinc-900/20 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    <span>{evt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-[0.98] pt-2"
          >
            Register Webhook
          </button>
        </form>
      </div>

      {/* ── WEBHOOK LIST & TIMELINE LOGS ─────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Endpoints List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Registered Endpoints</h3>
          
          {endpoints.length === 0 ? (
            <div className="p-8 border border-zinc-855 bg-zinc-950/20 rounded-2xl text-center text-xs text-zinc-650 font-bold uppercase">
              No registered webhook endpoints.
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.map((ep) => (
                <div key={ep.id} className="p-4 border border-zinc-855 bg-zinc-950/20 rounded-2xl space-y-3 group hover:border-zinc-800 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{ep.url}</p>
                      <p className="text-[9px] text-zinc-550 font-mono font-bold">Secret: {ep.secret}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Active Status switch */}
                      <button onClick={() => handleToggleActive(ep.id)} className="text-zinc-500 hover:text-white cursor-pointer">
                        {ep.active ? <ToggleRight size={22} className="text-purple-400" /> : <ToggleLeft size={22} className="text-zinc-650" />}
                      </button>

                      <button onClick={() => handleDeleteEndpoint(ep.id)} className="p-1 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 border-t border-zinc-850/50 pt-2">
                    {ep.events.map((evt) => (
                      <span key={evt} className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-900 border border-zinc-850 text-zinc-400">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliveries Logs */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-zinc-555 tracking-wider">Delivery Attempts Logs</h3>
          
          <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden divide-y divide-zinc-850/50">
            {logs.map((log) => {
              const isSuccess = log.statusCode === 200;
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 space-y-3 cursor-pointer hover:bg-zinc-900/10 transition-colors" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black border tracking-wider",
                          isSuccess ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                            : "bg-red-500/10 text-red-450 border-red-500/20 animate-pulse"
                        )}>
                          {log.statusCode}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-200">{log.event}</span>
                      </div>
                      <p className="text-[8px] text-zinc-500 truncate max-w-xs">{log.endpointUrl}</p>
                    </div>

                    <div className="flex items-center gap-3 text-[9px] text-zinc-550 font-mono font-bold">
                      <span>{log.latencyMs}ms</span>
                      <span>•</span>
                      <span>{log.retries} retries</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReplayLog(log); }}
                        className="p-1 bg-zinc-900 border border-zinc-800 hover:text-white rounded-lg cursor-pointer"
                        title="Replay Webhook"
                      >
                        <Play size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Expand payload JSON details */}
                  {isExpanded && (
                    <div className="p-3 bg-zinc-950 border border-zinc-850/60 rounded-xl space-y-3 text-[10px] font-mono leading-relaxed" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-zinc-550 uppercase">PAYLOAD BODY</span>
                          <pre className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg overflow-x-auto text-zinc-300 max-h-36 scrollbar-thin">{log.payload}</pre>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-zinc-555 uppercase">RESPONSE BODY</span>
                          <pre className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg overflow-x-auto text-zinc-300 max-h-36 scrollbar-thin">{log.responseBody}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
