"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, CheckCheck, Clock, AlertTriangle, Zap, Plus, Sparkles, Phone, FileText } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface TriggerRule {
  id: string;
  name: string;
  channel: "WHATSAPP" | "SMS" | "BOTH";
  triggerEvent: string;
  templateBody: string;
  enabled: boolean;
}

interface MessageLog {
  id: string;
  recipient: string;
  phone: string;
  trigger: string;
  channel: "WHATSAPP" | "SMS";
  status: "DELIVERED" | "READ" | "FAILED";
  sentAt: string;
}

const INITIAL_RULES: TriggerRule[] = [
  {
    id: "rule-1",
    name: "RSVP Confirmation Instant Push",
    channel: "WHATSAPP",
    triggerEvent: "GUEST_RSVP_SUBMITTED",
    templateBody: "Hi {{client_name}}, your RSVP for {{event_name}} on {{event_date}} is confirmed! Here is your venue map: {{map_link}}",
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Invoice Payment Due Reminder",
    channel: "BOTH",
    triggerEvent: "INVOICE_DUE_3_DAYS",
    templateBody: "Friendly reminder from {{agency_name}}: Invoice #{{invoice_id}} for {{amount}} is due on {{due_date}}. Pay securely: {{payment_link}}",
    enabled: true,
  },
  {
    id: "rule-3",
    name: "Day-of Venue Map Directions",
    channel: "WHATSAPP",
    triggerEvent: "EVENT_START_2_HOURS",
    templateBody: "See you soon! Directions to {{venue_name}}: {{map_link}}. Emergency coordinator phone: {{coordinator_phone}}",
    enabled: true,
  },
];

const INITIAL_LOGS: MessageLog[] = [
  { id: "msg-101", recipient: "Alexander Wright", phone: "+1 (555) 019-2831", trigger: "RSVP Confirmation", channel: "WHATSAPP", status: "READ", sentAt: "10 mins ago" },
  { id: "msg-102", recipient: "Sophia Martinez", phone: "+1 (555) 018-9920", trigger: "Invoice Payment Due", channel: "SMS", status: "DELIVERED", sentAt: "42 mins ago" },
  { id: "msg-103", recipient: "Liam O'Connor", phone: "+1 (555) 014-8831", trigger: "Day-of Venue Map", channel: "WHATSAPP", status: "DELIVERED", sentAt: "2 hours ago" },
];

export default function WhatsAppSmsDesk() {
  const { addToast } = useToastStore();
  const [rules, setRules] = useState<TriggerRule[]>(INITIAL_RULES);
  const [logs, setLogs] = useState<MessageLog[]>(INITIAL_LOGS);

  // New Rule Modal Form State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("GUEST_RSVP_SUBMITTED");
  const [ruleChannel, setRuleChannel] = useState<"WHATSAPP" | "SMS" | "BOTH">("WHATSAPP");
  const [ruleTemplate, setRuleTemplate] = useState("");

  const [testPhone, setTestPhone] = useState("+1 (555) 992-1082");

  const handleToggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    addToast("Trigger automation rule updated.", "info");
  };

  const handleSendTestMessage = (rule: TriggerRule) => {
    const newLog: MessageLog = {
      id: "msg-" + Date.now(),
      recipient: "Test Recipient",
      phone: testPhone,
      trigger: rule.name,
      channel: rule.channel === "BOTH" ? "WHATSAPP" : rule.channel,
      status: "DELIVERED",
      sentAt: "Just now",
    };
    setLogs([newLog, ...logs]);
    addToast(`📲 Test ${rule.channel} message transmitted to ${testPhone}!`, "success");
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleTemplate) {
      addToast("Please provide rule name and template body.", "error");
      return;
    }
    const newRule: TriggerRule = {
      id: "rule-" + Date.now(),
      name: ruleName,
      channel: ruleChannel,
      triggerEvent: ruleTrigger,
      templateBody: ruleTemplate,
      enabled: true,
    };
    setRules([newRule, ...rules]);
    setShowRuleModal(false);
    setRuleName("");
    setRuleTemplate("");
    addToast("✨ Automated WhatsApp/SMS trigger created successfully!", "success");
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.06] pb-4 gap-3">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Client Engagement & Notifications
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-400" /> WhatsApp & SMS Automation Desk
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Dispatch automated WhatsApp and SMS updates for RSVPs, invoices, and venue directions.
          </p>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Trigger Rule
        </button>
      </div>

      {/* Rules Section */}
      <div className="space-y-4">
        <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Active Trigger Workflows</span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-3 flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold text-white block">{rule.name}</span>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer",
                      rule.enabled ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all duration-300 absolute top-0.5", rule.enabled ? "left-4.5" : "left-0.5")} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-md text-[9px] font-mono font-bold uppercase">
                    {rule.channel}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">{rule.triggerEvent}</span>
                </div>

                <p className="text-[11px] text-zinc-400 font-mono bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl leading-relaxed">
                  "{rule.templateBody}"
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-[10px]">
                <button
                  onClick={() => handleSendTestMessage(rule)}
                  className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Send size={10} /> Test Send
                </button>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Zap size={10} /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Delivery Log */}
      <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Transmission Delivery Audit Log</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCheck size={12} /> 99.4% Delivery Success Rate
          </span>
        </div>

        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full text-xs font-medium text-zinc-300 font-mono">
            <thead>
              <tr className="text-left border-b border-white/[0.06] text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-white/[0.02]">
                <th className="p-3">Recipient</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Trigger Workflow</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3 font-bold text-white font-sans">{log.recipient}</td>
                  <td className="p-3 text-zinc-400">{log.phone}</td>
                  <td className="p-3 text-purple-400 font-bold">{log.trigger}</td>
                  <td className="p-3">{log.channel}</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border",
                      log.status === "READ" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-zinc-500 text-[10px]">{log.sentAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#09090b] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" /> New Automated Trigger Rule
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP RSVP Greeting"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Trigger Event</label>
                  <select
                    value={ruleTrigger}
                    onChange={(e) => setRuleTrigger(e.target.value)}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="GUEST_RSVP_SUBMITTED">Guest RSVP Submitted</option>
                    <option value="INVOICE_DUE_3_DAYS">Invoice Due in 3 Days</option>
                    <option value="EVENT_START_2_HOURS">2 Hours Before Event</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Channel</label>
                  <select
                    value={ruleChannel}
                    onChange={(e) => setRuleChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="WHATSAPP">WhatsApp API</option>
                    <option value="SMS">Twilio SMS</option>
                    <option value="BOTH">WhatsApp + SMS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Message Template (Dynamic Merge Tags)</label>
                <textarea
                  rows={4}
                  placeholder="Hi {{client_name}}, your booking for {{event_date}} is confirmed..."
                  value={ruleTemplate}
                  onChange={(e) => setRuleTemplate(e.target.value)}
                  className="w-full p-3 bg-white/[0.02] border border-white/[0.06] text-white rounded-xl outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 border border-white/[0.06] text-zinc-400 hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Save Trigger Rule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
