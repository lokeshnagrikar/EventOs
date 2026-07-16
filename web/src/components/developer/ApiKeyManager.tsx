"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toastStore";
import { INITIAL_API_KEYS, ApiKeyItem } from "@/lib/developerData";

const AVAILABLE_SCOPES = [
  { value: "crm.read", label: "Read CRM Leads" },
  { value: "crm.write", label: "Write CRM Leads" },
  { value: "events.read", label: "Read Events" },
  { value: "events.write", label: "Write Events" },
  { value: "invoices.read", label: "Read Invoices" },
  { value: "invoices.write", label: "Write Invoices" },
  { value: "payments.read", label: "Read Payments" },
];

export default function ApiKeyManager() {
  const { addToast } = useToastStore();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"development" | "production">("development");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["crm.read", "events.read"]);

  // Secret display modal
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("eventos_developer_keys");
    if (stored) {
      try {
        setKeys(JSON.parse(stored));
      } catch {
        setKeys(INITIAL_API_KEYS);
      }
    } else {
      setKeys(INITIAL_API_KEYS);
      localStorage.setItem("eventos_developer_keys", JSON.stringify(INITIAL_API_KEYS));
    }
  }, []);

  const saveKeys = (updated: ApiKeyItem[]) => {
    setKeys(updated);
    localStorage.setItem("eventos_developer_keys", JSON.stringify(updated));
  };

  const handleToggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Please enter an API Key name.", "info");
      return;
    }
    if (selectedScopes.length === 0) {
      addToast("Please select at least one permission scope.", "info");
      return;
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const fullToken = `evos_${environment}_${token}`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now().toString(36).toUpperCase()}`,
      name,
      keyPreview: `evos_${environment}_${fullToken.slice(10, 14)}...${fullToken.slice(-4)}`,
      environment,
      scopes: selectedScopes,
      lastUsed: "Never",
      createdAt: new Date().toISOString(),
    };

    saveKeys([newKey, ...keys]);
    setGeneratedKey(fullToken);
    setName("");
    addToast("API Access Key generated successfully!", "success");
  };

  const handleRevokeKey = (id: string) => {
    saveKeys(keys.filter((k) => k.id !== id));
    addToast("API Key revoked permanently.", "success");
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── CREATE KEY FORM ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        <form onSubmit={handleCreateKey} className="p-5 border border-zinc-850 bg-zinc-950/20 rounded-2xl space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
            <Key size={13} />
            Generate Access Key
          </h3>

          {/* Key name */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Access Token Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Webhook Delivery Sync"
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">Environment Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {(["development", "production"] as const).map((env) => {
                const active = environment === env;
                return (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={cn(
                      "py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      active ? "bg-purple-500/10 border-purple-500/25 text-purple-400"
                        : "border-zinc-850 bg-zinc-900/40 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    {env}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permission scopes checkboxes */}
          <div className="space-y-2 pt-2 border-t border-zinc-850/50">
            <label className="text-[9px] font-black uppercase text-zinc-555 tracking-wider flex items-center gap-1">
              <Shield size={10} /> Permissions Scopes
            </label>
            
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {AVAILABLE_SCOPES.map((scope) => {
                const active = selectedScopes.includes(scope.value);
                return (
                  <button
                    key={scope.value}
                    type="button"
                    onClick={() => handleToggleScope(scope.value)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-between cursor-pointer",
                      active ? "bg-purple-500/5 border-purple-500/15 text-purple-400"
                        : "border-zinc-850/60 bg-zinc-900/20 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    <span>{scope.label}</span>
                    <span className="font-mono text-[9px] opacity-60">{scope.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-500/10 active:scale-[0.98] pt-2"
          >
            Create API Key
          </button>
        </form>
      </div>

      {/* ── API KEYS TABLE ───────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-550 tracking-wider">Access keys ledger</h3>
        
        {keys.length === 0 ? (
          <div className="p-12 border border-zinc-850 bg-zinc-950/20 rounded-2xl text-center space-y-2">
            <Key size={32} className="mx-auto text-zinc-700" />
            <p className="text-xs text-zinc-500 font-bold">No developer API access keys found in workspace.</p>
          </div>
        ) : (
          <div className="border border-zinc-850 rounded-2xl bg-zinc-950/20 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-555 border-b border-zinc-850/60">
                  <tr>
                    <th className="px-5 py-3">Key Name</th>
                    <th className="px-5 py-3">Token Token</th>
                    <th className="px-5 py-3 text-center">Environment</th>
                    <th className="px-5 py-3 text-center">Last Used</th>
                    <th className="px-5 py-3 text-center">Created Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-900/10 transition-colors group">
                      <td className="px-5 py-3.5 font-bold text-zinc-200">{k.name}</td>
                      <td className="px-5 py-3.5 font-mono text-zinc-450 font-bold">{k.keyPreview}</td>
                      <td className="px-5 py-3.5 text-center font-semibold">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider",
                          k.environment === "production" ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-450 border-blue-500/20"
                        )}>
                          {k.environment}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-zinc-500 font-mono text-[10px]">
                        {k.lastUsed === "Never" ? "Never" : new Date(k.lastUsed).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-zinc-500 font-mono text-[10px]">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Revoke Key"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── GENERATED SECRET MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {generatedKey && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-200 tracking-wider">Secret Key Generated</h3>
                  <p className="text-[9px] text-zinc-550 font-semibold mt-0.5">Please copy your token now. It will not be shown again.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-[11px] font-mono select-all">
                <span className="truncate text-zinc-200">{generatedKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    setCopiedKey(true);
                    addToast("Copied to clipboard!", "success");
                  }}
                  className="text-purple-400 hover:text-white font-bold ml-2 cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={13} />}
                </button>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3 text-[10px] text-amber-400 leading-relaxed font-semibold">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Ensure this key is stored securely. Sharing or exposing API tokens can lead to data leaks or unauthorized resource access.</p>
              </div>

              <button
                onClick={() => {
                  setGeneratedKey(null);
                  setCopiedKey(false);
                }}
                className="w-full py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-zinc-850"
              >
                Close & Finalize
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
