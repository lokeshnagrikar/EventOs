"use client";

import React, { useEffect, useState } from "react";
import { X, Filter, Trash2, Bookmark, Star, Plus } from "lucide-react";
import { EVENT_TYPES_GROUPED, LEAD_SOURCES } from "@/config/eventTypes";

interface SmartFiltersProps {
  sourceFilter: string;
  setSourceFilter: (val: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (val: string) => void;
  minBudget: string;
  setMinBudget: (val: string) => void;
  maxBudget: string;
  setMaxBudget: (val: string) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  eventTypeFilter: string;
  setEventTypeFilter: (val: string) => void;
  teamMembers: Array<{ id: string; firstName: string; lastName: string }>;
  onClear: () => void;
}

interface SavedFilter {
  name: string;
  source: string;
  assignee: string;
  minBudget: string;
  maxBudget: string;
  priority: string;
  eventType: string;
  sortBy: string;
}

export default function SmartFilters({
  sourceFilter,
  setSourceFilter,
  assigneeFilter,
  setAssigneeFilter,
  minBudget,
  setMinBudget,
  maxBudget,
  setMaxBudget,
  sortBy,
  setSortBy,
  priorityFilter,
  setPriorityFilter,
  eventTypeFilter,
  setEventTypeFilter,
  teamMembers = [],
  onClear,
}: SmartFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  // Load saved filters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_saved_presets");
      if (saved) {
        try {
          setSavedFilters(JSON.parse(saved));
        } catch (e) {}
      } else {
        // Seed default presets
        const defaults: SavedFilter[] = [
          { name: "VIP High Budget", source: "ALL", assignee: "ALL", minBudget: "500000", maxBudget: "", priority: "HIGH", eventType: "ALL", sortBy: "budgetDesc" },
          { name: "Website Leads", source: "Website", assignee: "ALL", minBudget: "", maxBudget: "", priority: "ALL", eventType: "ALL", sortBy: "newest" },
          { name: "Needs Proposals", source: "ALL", assignee: "ALL", minBudget: "", maxBudget: "", priority: "ALL", eventType: "ALL", sortBy: "newest" }
        ];
        setSavedFilters(defaults);
        localStorage.setItem("crm_saved_presets", JSON.stringify(defaults));
      }
    }
  }, []);

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedFilter = {
      name: newPresetName,
      source: sourceFilter,
      assignee: assigneeFilter,
      minBudget,
      maxBudget,
      priority: priorityFilter,
      eventType: eventTypeFilter,
      sortBy
    };
    const updated = [...savedFilters, newPreset];
    setSavedFilters(updated);
    localStorage.setItem("crm_saved_presets", JSON.stringify(updated));
    setNewPresetName("");
  };

  const applyPreset = (preset: SavedFilter) => {
    setSourceFilter(preset.source);
    setAssigneeFilter(preset.assignee);
    setMinBudget(preset.minBudget);
    setMaxBudget(preset.maxBudget);
    setPriorityFilter(preset.priority);
    setEventTypeFilter(preset.eventType);
    setSortBy(preset.sortBy);
  };

  const deletePreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.name !== name);
    setSavedFilters(updated);
    localStorage.setItem("crm_saved_presets", JSON.stringify(updated));
  };

  return (
    <div className="bg-slate-50/80 dark:bg-[#111113]/60 border-b border-slate-200/90 dark:border-white/[0.08] p-6 space-y-5 animate-in fade-in duration-200 select-none backdrop-blur-md">
      
      {/* Search Filter Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5">
        {/* Lead Source */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-widest block">Lead Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
          >
            <option value="ALL">All Sources</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src.key} value={src.key}>
                {src.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Planner */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-widest block">Assigned Planner</label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
          >
            <option value="ALL">All Planners</option>
            <option value="UNASSIGNED">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-widest block">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-widest block">Event Category</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
          >
            <option value="ALL">All Categories</option>
            {EVENT_TYPES_GROUPED.map((group) => (
              <optgroup key={group.category} label={group.category} className="bg-slate-100 dark:bg-zinc-900 text-slate-500 font-bold">
                {group.options.map((opt) => (
                  <option key={opt.key} value={opt.key} className="text-slate-900 dark:text-white font-medium">
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Budget range */}
        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <label className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-widest block">Budget (Min / Max INR)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="Min"
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 dark:placeholder-zinc-600 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
            />
            <span className="text-slate-400 dark:text-zinc-600 text-xs font-bold">to</span>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Max"
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 dark:placeholder-zinc-600 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-purple-600 transition-all font-semibold shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Preset management and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-200/90 dark:border-white/[0.08] pt-4">
        {/* Saved Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 tracking-wider mr-2 flex items-center gap-1.5">
            <Bookmark size={11} className="text-purple-600 dark:text-purple-400" />
            Presets:
          </span>
          {savedFilters.map((preset) => (
            <div
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500/40 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:text-purple-700 dark:hover:text-purple-400 rounded-full transition-all cursor-pointer group shadow-sm"
            >
              <span>{preset.name}</span>
              <button
                onClick={(e) => deletePreset(preset.name, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-zinc-500 hover:text-red-500 transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Save Current Preset & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto self-end">
          <div className="flex bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 w-full max-w-[200px] shadow-sm">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="New Preset Name"
              className="w-full pl-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none"
            />
            <button
              onClick={saveCurrentAsPreset}
              className="h-6 w-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center cursor-pointer transition shadow-sm active:scale-95"
              title="Save current filters"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer transition-all shrink-0 shadow-sm"
          >
            <Trash2 size={12} />
            Reset
          </button>
        </div>
      </div>

    </div>
  );
}
