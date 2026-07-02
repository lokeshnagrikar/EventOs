"use client";

import React, { useEffect, useState } from "react";
import { X, Filter, Trash2, Bookmark, Star, Plus } from "lucide-react";

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
    <div className="bg-[#111113]/60 border-b border-zinc-800 p-6 space-y-5 animate-in fade-in duration-200 select-none">
      
      {/* Search Filter Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5">
        {/* Lead Source */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Lead Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-xl text-xs focus:outline-none focus:border-purple-650 transition-all font-semibold"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Referral">Referral</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        {/* Assigned Planner */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Assigned Planner</label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-xl text-xs focus:outline-none focus:border-purple-650 transition-all font-semibold"
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
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-xl text-xs focus:outline-none focus:border-purple-650 transition-all font-semibold"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Event Category</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-xl text-xs focus:outline-none focus:border-purple-650 transition-all font-semibold"
          >
            <option value="ALL">All Categories</option>
            <option value="WEDDING">Wedding</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="ENGAGEMENT">Engagement</option>
            <option value="CORPORATE">Corporate</option>
          </select>
        </div>

        {/* Budget range */}
        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Budget (Min / Max INR)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="Min"
              className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-650 transition-all font-semibold"
            />
            <span className="text-zinc-600 text-xs">to</span>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Max"
              className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-purple-650 transition-all font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Preset management and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-zinc-850/60 pt-4">
        {/* Saved Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mr-2 flex items-center gap-1.5">
            <Bookmark size={11} className="text-purple-400" />
            Presets:
          </span>
          {savedFilters.map((preset) => (
            <div
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 text-[10px] font-bold text-zinc-400 hover:text-purple-400 rounded-full transition-all cursor-pointer group"
            >
              <span>{preset.name}</span>
              <button
                onClick={(e) => deletePreset(preset.name, e)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Save Current Preset & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto self-end">
          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-0.5 w-full max-w-[200px]">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="New Preset Name"
              className="w-full pl-2.5 bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none"
            />
            <button
              onClick={saveCurrentAsPreset}
              className="h-6 w-6 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer transition"
              title="Save current filters"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-850 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all shrink-0"
          >
            <Trash2 size={12} />
            Reset
          </button>
        </div>
      </div>

    </div>
  );
}
