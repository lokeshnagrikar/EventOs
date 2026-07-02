"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number (minimum 10 digits)." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
  eventType: z.string().min(1, { message: "Event type is required." }),
  eventDate: z.string().min(1, { message: "Event date is required." }),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Budget must be a positive number.",
  }),
  leadSource: z.string().min(1, { message: "Lead source is required." }),
  notes: z.string().optional(),
});

type LeadInputs = z.infer<typeof leadSchema>;

export default function NewLeadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInputs>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: LeadInputs) => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/crm/leads", {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        eventType: data.eventType,
        eventDate: data.eventDate,
        budget: Number(data.budget),
        leadSource: data.leadSource,
        notes: data.notes || "",
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/crm");
      }, 1500);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || "Failed to create lead. Please check network logs.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden">
      
      {/* Background glow effects to match landing page theme */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center gap-3 z-20 shrink-0">
        <button 
          onClick={() => router.push("/crm")}
          className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
          aria-label="Back to CRM"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-base">CRM</span>
        <span className="text-zinc-500">/</span>
        <span className="text-sm text-zinc-400">Log New Lead</span>
      </nav>

      {/* Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent pointer-events-none" />

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Lead Logged Successfully!</h2>
              <p className="text-sm text-zinc-400">Redirecting you back to the pipeline board...</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-bold">Log New Event Lead</h2>
                <p className="text-xs text-zinc-400">Enter client requirements to seed them into the CRM pipeline.</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Name Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="name">Client / Wedding Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g., Kapoor Wedding Decor"
                      className={`w-full pl-10 pr-4 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                        errors.name ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                      }`}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-red-400 font-medium">{errors.name.message}</p>}
                </div>

                {/* Grid Group 1: Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="phone">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        id="phone"
                        type="text"
                        placeholder="9876543210"
                        className={`w-full pl-10 pr-4 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                          errors.phone ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                        }`}
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-400 font-medium">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="email">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        id="email"
                        type="email"
                        placeholder="client@mail.com"
                        className={`w-full pl-10 pr-4 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                          errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                        }`}
                        {...register("email")}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-red-400 font-medium">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Grid Group 2: Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="eventType">Event Type</label>
                    <select
                      id="eventType"
                      className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                        errors.eventType ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                      }`}
                      {...register("eventType")}
                    >
                      <option value="">Choose type</option>
                      <option value="WEDDING">Wedding Ceremony</option>
                      <option value="BIRTHDAY">Birthday Party</option>
                      <option value="ENGAGEMENT">Engagement Decor</option>
                      <option value="CORPORATE">Corporate Summit</option>
                    </select>
                    {errors.eventType && <p className="text-[10px] text-red-400 font-medium">{errors.eventType.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="eventDate">Event Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        id="eventDate"
                        type="date"
                        className={`w-full pl-10 pr-4 py-1.5 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                          errors.eventDate ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                        }`}
                        {...register("eventDate")}
                      />
                    </div>
                    {errors.eventDate && <p className="text-[10px] text-red-400 font-medium">{errors.eventDate.message}</p>}
                  </div>
                </div>

                {/* Grid Group 3: Financial & Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="budget">Budget Allocation (INR)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        id="budget"
                        type="text"
                        placeholder="e.g., 500000"
                        className={`w-full pl-10 pr-4 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                          errors.budget ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                        }`}
                        {...register("budget")}
                      />
                    </div>
                    {errors.budget && <p className="text-[10px] text-red-400 font-medium">{errors.budget.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400" htmlFor="leadSource">Lead Source</label>
                    <select
                      id="leadSource"
                      className={`w-full px-3 py-2 bg-[#18181B] border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 ${
                        errors.leadSource ? "border-red-500/50" : "border-zinc-800 focus:border-purple-600"
                      }`}
                      {...register("leadSource")}
                    >
                      <option value="">Select source</option>
                      <option value="WedMeGood">WedMeGood</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Referral">Word of Mouth Referral</option>
                      <option value="Website">Agency Website</option>
                    </select>
                    {errors.leadSource && <p className="text-[10px] text-red-400 font-medium">{errors.leadSource.message}</p>}
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400" htmlFor="notes">Event Brief / Client Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="e.g., Client wants a dynamic pastel theme with LED pathways..."
                      className="w-full pl-10 pr-4 py-2 bg-[#18181B] border border-zinc-800 focus:border-purple-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                      {...register("notes")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-600/10 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? "Recording Lead..." : "Add Lead to Kanban Pipeline"}
                </button>

              </form>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
