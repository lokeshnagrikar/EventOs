"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Play, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Settings, 
  Cpu, 
  Zap, 
  HelpCircle,
  Mail,
  Users,
  FileText,
  Calendar,
  Layers,
  Image as ImageIcon,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WorkflowNode {
  id: string;
  type: "trigger" | "action";
  title: string;
  desc: string;
  icon: React.ReactNode;
  status: "idle" | "firing" | "completed";
}

export default function AutomationPage() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: "n1", type: "trigger", title: "When Quote Accepted", desc: "Triggers immediately when client signs proposal", icon: <Zap size={16} />, status: "idle" },
    { id: "n2", type: "action", title: "Create Confirmed Booking", desc: "Automates event booking creation", icon: <Layers size={16} />, status: "idle" },
    { id: "n3", type: "action", title: "Generate Invoice & Bill", desc: "Creates draft invoicing statement", icon: <FileText size={16} />, status: "idle" },
    { id: "n4", type: "action", title: "Notify Staff & Coordinators", desc: "Pushes real-time alerts to Slack/SMTP", icon: <Users size={16} />, status: "idle" },
    { id: "n5", type: "action", title: "Generate Event Timeline", desc: "Installs core operational calendar tasks", icon: <Calendar size={16} />, status: "idle" },
    { id: "n6", type: "action", title: "Create Gallery Album", desc: "Sets up high-res client portal upload folders", icon: <ImageIcon size={16} />, status: "idle" },
    { id: "n7", type: "action", title: "Send Client Confirmation Email", desc: "Sends custom branded welcome package", icon: <Mail size={16} />, status: "idle" }
  ]);

  const runSimulation = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStep(0);

    let current = 0;
    const interval = setInterval(() => {
      setNodes((prev) => 
        prev.map((node, idx) => {
          if (idx === current) return { ...node, status: "firing" };
          if (idx < current) return { ...node, status: "completed" };
          return node;
        })
      );

      current++;
      setActiveStep(current);

      if (current >= nodes.length) {
        clearInterval(interval);
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => ({ ...n, status: "idle" })));
          setIsPlaying(false);
          setActiveStep(null);
        }, 1500);
      }
    }, 1200);
  };

  const addNode = () => {
    const newNode: WorkflowNode = {
      id: Math.random().toString(),
      type: "action",
      title: "Log Activity Audit Trail",
      desc: "Automatically records state transitions in audit log",
      icon: <Activity size={16} />,
      status: "idle"
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    if (nodes.length <= 2) return; // keep minimum
    setNodes(nodes.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/85 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Automation Center</span>
            <span className="text-xs px-2 py-0.5 bg-purple-950/30 border border-purple-900/30 rounded text-purple-400 font-bold uppercase tracking-wider font-mono">Workflows</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/15 cursor-pointer"
          >
            <Play size={13} className={isPlaying ? "animate-spin" : ""} />
            {isPlaying ? "Simulating Run..." : "Test Workflow Pipeline"}
          </button>
        </div>
      </nav>

      {/* Main Workspace split */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-1 p-6 border border-zinc-850 bg-[#111113]/40 rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-6 h-fit">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-400" />
                Workflow Parameters
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">Configure automated triggers to scale operations without manual overhead.</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[10px] text-zinc-500 font-bold uppercase block">Trigger Origin</label>
              <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-600">
                <option>CRM / Quote Acceptance Signature</option>
                <option>Manual Invoice Clearance</option>
                <option>Lead Form Ingress</option>
                <option>API Webhook Dispatch</option>
              </select>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[10px] text-zinc-500 font-bold uppercase block">Execution Mode</label>
              <div className="p-3 border border-zinc-800 bg-zinc-950/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300">Atomic Runs</span>
                  <span className="text-[9px] bg-emerald-950/25 text-emerald-450 border border-emerald-900/30 px-1.5 py-0.5 rounded font-black">ENABLED</span>
                </div>
                <p className="text-[10px] text-zinc-550 leading-relaxed">If any step fails (e.g. invoice generation or staff allocation), previous states are automatically rolled back.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={addNode}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} />
              Add Pipeline Node
            </button>
            <div className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 size={11} className="text-emerald-450" />
              SaaS Engine Synced
            </div>
          </div>
        </div>

        {/* Right Visual Connection Board */}
        <div className="lg:col-span-3 border border-zinc-850 bg-zinc-900/10 rounded-2xl p-6 min-h-[550px] flex flex-col items-center overflow-y-auto relative">
          
          <div className="absolute top-4 left-6 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <Zap size={11} className="text-purple-400 animate-pulse" />
            Visual Graph editor
          </div>

          {/* Nodes Pipeline Stack */}
          <div className="w-full max-w-md py-8 space-y-6 flex flex-col items-center">
            {nodes.map((node, idx) => {
              const isTrigger = node.type === "trigger";
              const isFiring = node.status === "firing";
              const isCompleted = node.status === "completed";

              return (
                <React.Fragment key={node.id}>
                  {/* Connection line */}
                  {idx > 0 && (
                    <div className="h-6 w-0.5 relative bg-zinc-800">
                      {/* Firing dot animation */}
                      {isPlaying && activeStep === idx && (
                        <motion.div
                          initial={{ y: -24 }}
                          animate={{ y: 24 }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                          className="absolute left-[-3px] h-2 w-2 rounded-full bg-purple-450 shadow-md shadow-purple-500"
                        />
                      )}
                    </div>
                  )}

                  {/* Node Card */}
                  <motion.div
                    className={`relative w-full p-4 border rounded-xl flex items-center justify-between transition-all duration-200 ${
                      isTrigger 
                        ? "border-purple-650/40 bg-purple-950/[0.03] hover:border-purple-500/50" 
                        : isFiring 
                        ? "border-purple-500 bg-purple-550/10 shadow-lg shadow-purple-500/10 scale-[1.02]" 
                        : isCompleted 
                        ? "border-emerald-500/40 bg-emerald-950/[0.02]" 
                        : "border-zinc-850 bg-[#111113]/35 hover:border-zinc-800"
                    }`}
                  >
                    {/* Glow indicators */}
                    {isFiring && (
                      <span className="absolute -inset-px border border-purple-400 rounded-xl blur-sm pointer-events-none opacity-50" />
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                        isTrigger 
                          ? "bg-purple-950/20 border-purple-800/30 text-purple-400"
                          : isFiring 
                          ? "bg-purple-600 text-white border-purple-500" 
                          : isCompleted 
                          ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400"
                      }`}>
                        {node.icon}
                      </div>

                      <div className="space-y-0.5">
                        <span className={`font-extrabold text-xs block ${
                          isFiring ? "text-purple-300" : isCompleted ? "text-emerald-450" : "text-zinc-200"
                        }`}>
                          {node.title}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-medium">{node.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isTrigger ? (
                        <span className="text-[8px] bg-purple-950/40 text-purple-400 border border-purple-900/30 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Trigger
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteNode(node.id)}
                            className="p-1.5 hover:bg-zinc-950 border border-transparent hover:border-zinc-800 rounded-lg text-zinc-550 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete step"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
