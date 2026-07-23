"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Flame, AlertTriangle, ShieldCheck, TrendingUp, Sparkles, CheckCircle2, UserCheck, RefreshCw } from "lucide-react";
import { useToastStore } from "@/lib/toastStore";
import { cn } from "@/lib/utils";

interface LeadScoreItem {
  id: string;
  name: string;
  eventType: string;
  budget: string;
  score: number;
  grade: "HOT" | "WARM" | "COLD";
  reason: string;
}

interface ChurnRiskItem {
  id: string;
  clientName: string;
  eventName: string;
  contractValue: string;
  riskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  signals: string[];
  aiAction: string;
}

const INITIAL_LEAD_SCORES: LeadScoreItem[] = [
  { id: "lead-1", name: "Samantha & Daniel", eventType: "Destination Wedding", budget: "$150,000", score: 94, grade: "HOT", reason: "High budget fit, prompt response, verified venue date" },
  { id: "lead-2", name: "Global Tech Summit 2026", eventType: "Corporate Conference", budget: "$85,000", score: 88, grade: "HOT", reason: "RFP pre-approved, contract ready for signature" },
  { id: "lead-3", name: "Marcus Vance", eventType: "Birthday Gala", budget: "$12,000", score: 45, grade: "COLD", reason: "Budget below minimum threshold, delayed response" },
];

const INITIAL_CHURN_RISKS: ChurnRiskItem[] = [
  {
    id: "churn-1",
    clientName: "Elevate Orgs",
    eventName: "Annual Partner Summit",
    contractValue: "$45,000",
    riskScore: 82,
    riskLevel: "CRITICAL",
    signals: ["Invoice #INV-2041 unpaid for 14 days", "3 unopened event timeline emails", "Venue scope reduced"],
    aiAction: "Schedule emergency VIP Account Manager call & offer complimentary AV upgrade.",
  },
  {
    id: "churn-2",
    clientName: "Harper & Mason Wedding",
    eventName: "Luxury Beachfront Wedding",
    contractValue: "$95,000",
    riskScore: 58,
    riskLevel: "MEDIUM",
    signals: ["Delay in guest list submission", "Competitor quote requested"],
    aiAction: "Send personalized 3D seating preview link to boost engagement.",
  },
];

export default function LeadScoringChurnPredictor() {
  const { addToast } = useToastStore();
  const [leadScores, setLeadScores] = useState<LeadScoreItem[]>(INITIAL_LEAD_SCORES);
  const [churnRisks, setChurnRisks] = useState<ChurnRiskItem[]>(INITIAL_CHURN_RISKS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAiAnalysis = () => {
    setIsGenerating(true);
  };

  const handleExecuteRetentionAction = (clientName: string, action: string) => {
    addToast(`🚀 Executing AI Retention Action for ${clientName}: "${action}"`, "success");
  };

  return (
    <div className="space-y-6 select-none text-zinc-300 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.06] pb-4 gap-3">
        <div>
          <span className="text-[9px] text-purple-400 font-mono font-extrabold uppercase tracking-widest block">
            Predictive Business Intelligence
          </span>
          <h2 className="text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
            <Flame size={18} className="text-amber-400" /> AI Lead Scoring & Churn Predictor
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Predict lead conversion probabilities and preemptively prevent client churn using machine learning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI Smart Lead Scoring */}
        <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Lead Conversion Probability Index</span>
            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
              <Flame size={12} /> High Velocity Leads
            </span>
          </div>

          <div className="space-y-3">
            {leadScores.map((lead) => (
              <div key={lead.id} className="p-4 border border-white/[0.06] bg-white/[0.01] rounded-xl space-y-2 hover:border-purple-500/30 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{lead.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">{lead.eventType} • {lead.budget}</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono border",
                    lead.grade === "HOT" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}>
                    Score {lead.score}/100 ({lead.grade})
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono bg-white/[0.01] p-2 rounded-lg border border-white/[0.04]">
                  💡 AI Insight: {lead.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Churn Risk Predictor */}
        <div className="p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl rounded-2xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block font-mono">Client Cancellation & Churn Risk Radar</span>
            <span className="text-[10px] text-red-400 font-mono font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> Retention Alerts Active
            </span>
          </div>

          <div className="space-y-3">
            {churnRisks.map((churn) => (
              <div key={churn.id} className="p-4 border border-red-500/20 bg-red-950/10 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{churn.clientName}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">{churn.eventName} • {churn.contractValue}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                    {churn.riskScore}% Churn Risk ({churn.riskLevel})
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Detected Risk Signals:</span>
                  <ul className="text-[10px] text-zinc-400 font-mono list-disc list-inside space-y-0.5">
                    {churn.signals.map((sig, i) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <span className="text-[10px] text-purple-300 font-mono font-bold flex items-center gap-1">
                    <Sparkles size={11} /> Recommended: {churn.aiAction}
                  </span>
                  <button
                    onClick={() => handleExecuteRetentionAction(churn.clientName, churn.aiAction)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    Execute Retention
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
