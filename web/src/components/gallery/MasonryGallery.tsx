"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, Heart, Check, Trash2, Tag, Copy, Move, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  albumId: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  publicId?: string;
  size?: number;
  format?: string;
  duration?: number;
  createdAt: string;
  favorite?: boolean;
}

interface MasonryGalleryProps {
  items: GalleryItem[];
  onSelectItem: (index: number) => void;
  onToggleFavorite: (itemId: string, favorite: boolean) => void;
  onDeleteItems: (itemIds: string[]) => void;
  onMoveItems: (itemIds: string[], targetAlbumId: string) => void;
  onCopyItems: (itemIds: string[], targetAlbumId: string) => void;
  onBatchTagItems: (itemIds: string[], tags: string[]) => void;
  albums: { id: string; name: string }[];
  readOnly?: boolean;
}

export default function MasonryGallery({
  items,
  onSelectItem,
  onToggleFavorite,
  onDeleteItems,
  onMoveItems,
  onCopyItems,
  onBatchTagItems,
  albums,
  readOnly = false
}: MasonryGalleryProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [numColumns, setNumColumns] = useState(5);
  
  // Dialog Actions State
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedTargetAlbumId, setSelectedTargetAlbumId] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Simulated Download States
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // Resize listener to adjust Pinterest columns dynamically
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1280) setNumColumns(5);
      else if (w >= 1024) setNumColumns(4);
      else if (w >= 768) setNumColumns(3);
      else setNumColumns(2);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Partition elements into columns for true Masonry layout
  const columns = useMemo(() => {
    const cols: GalleryItem[][] = Array.from({ length: numColumns }, () => []);
    items.forEach((item, index) => {
      cols[index % numColumns].push(item);
    });
    return cols;
  }, [items, numColumns]);

  const toggleItemSelection = (id: string, ev?: React.MouseEvent) => {
    if (ev) ev.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: GalleryItem, index: number) => {
    if (selectMode) {
      toggleItemSelection(item.id);
    } else {
      onSelectItem(index);
    }
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger file download
          setTimeout(() => setDownloadProgress(null), 1000);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const handleBatchTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      onBatchTagItems(selectedIds, tags);
      setTagInput("");
      setShowTagDialog(false);
      setSelectedIds([]);
      setSelectMode(false);
    }
  };

  const executeMove = () => {
    if (selectedTargetAlbumId) {
      onMoveItems(selectedIds, selectedTargetAlbumId);
      setShowMoveDialog(false);
      setSelectedIds([]);
      setSelectMode(false);
    }
  };

  const executeCopy = () => {
    if (selectedTargetAlbumId) {
      onCopyItems(selectedIds, selectedTargetAlbumId);
      setShowCopyDialog(false);
      setSelectedIds([]);
      setSelectMode(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Selection Mode Header Bar */}
      <div className="flex justify-between items-center bg-[#121214]/60 border border-zinc-850 p-3 rounded-2xl">
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds([]);
            }}
            className={cn(
              "px-3.5 py-1.5 border rounded-xl font-bold transition-all",
              selectMode ? "bg-purple-950/20 border-purple-550/40 text-purple-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850"
            )}
          >
            {selectMode ? "Exit Selection" : "Select Assets"}
          </button>
          {selectMode && (
            <span className="font-extrabold text-zinc-400">{selectedIds.length} assets selected</span>
          )}
        </div>

        {/* Bulk Action Buttons */}
        {selectMode && selectedIds.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleBulkDownload} className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl" title="Bulk Download">
              <Download size={13} />
            </button>
            {!readOnly && (
              <>
                <button onClick={() => setShowTagDialog(true)} className="p-2 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl" title="Bulk Tag">
                  <Tag size={13} />
                </button>
                <button onClick={() => setShowMoveDialog(true)} className="p-2 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl" title="Move to Album">
                  <Move size={13} />
                </button>
                <button onClick={() => setShowCopyDialog(true)} className="p-2 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl" title="Copy to Album">
                  <Copy size={13} />
                </button>
                <button onClick={() => onDeleteItems(selectedIds)} className="p-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 text-zinc-400 hover:text-red-400 rounded-xl" title="Bulk Delete">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Download progress bar */}
      {downloadProgress !== null && (
        <div className="p-4 border border-zinc-850 bg-zinc-950/20 rounded-xl flex items-center justify-between gap-4 text-xs">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="font-extrabold text-zinc-250">Compiling asset archive...</span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-purple-550 rounded-full transition-all" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Pinterest Masonry layout columns */}
      <div className="flex gap-4">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex-1 flex flex-col gap-4">
            {col.map((item) => {
              // Retrieve original overall index of this item
              const origIndex = items.findIndex((i) => i.id === item.id);
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item, origIndex)}
                  className={cn(
                    "group relative rounded-xl overflow-hidden border bg-zinc-900/10 cursor-pointer transition-all duration-300",
                    isSelected ? "border-purple-650 scale-98 shadow-2xl shadow-purple-500/5" : "border-zinc-850 hover:border-zinc-750"
                  )}
                >
                  {/* Media item rendering */}
                  {item.type === "VIDEO" ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url.replace(".mp4", ".jpg")} alt={item.name} className="w-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <Video className="text-white" size={24} />
                      </div>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full object-cover rounded-lg group-hover:scale-[1.01] transition-transform duration-500"
                    />
                  )}

                  {/* Checkbox overlay in selectMode */}
                  {selectMode && (
                    <div
                      onClick={(e) => toggleItemSelection(item.id, e)}
                      className={cn(
                        "absolute top-3 left-3 h-5 w-5 rounded-full border flex items-center justify-center z-20 transition-all",
                        isSelected ? "bg-purple-600 border-purple-500" : "bg-black/60 border-zinc-750 backdrop-blur-md"
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white font-extrabold" />}
                    </div>
                  )}

                  {/* Favorite & Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between z-10 pointer-events-none">
                    <div className="flex justify-end pointer-events-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id, !item.favorite);
                        }}
                        className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-red-500"
                      >
                        <Heart size={13} fill={item.favorite ? "#ef4444" : "transparent"} className={cn(item.favorite && "text-red-500")} />
                      </button>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-black text-zinc-100 block truncate">{item.name}</span>
                      <span className="text-[8px] text-zinc-450 uppercase font-black tracking-widest">{item.type}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* MOVE DIALOG */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Move Selected Assets</h3>
            <select
              value={selectedTargetAlbumId}
              onChange={(e) => setSelectedTargetAlbumId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs"
            >
              <option value="">-- Select target album --</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowMoveDialog(false)} className="px-3 py-1.5 border border-zinc-805 bg-zinc-900 rounded-lg text-xs">Cancel</button>
              <button onClick={executeMove} className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold">Move</button>
            </div>
          </div>
        </div>
      )}

      {/* COPY DIALOG */}
      {showCopyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Copy Selected Assets</h3>
            <select
              value={selectedTargetAlbumId}
              onChange={(e) => setSelectedTargetAlbumId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs"
            >
              <option value="">-- Select target album --</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCopyDialog(false)} className="px-3 py-1.5 border border-zinc-805 bg-zinc-900 rounded-lg text-xs">Cancel</button>
              <button onClick={executeCopy} className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold">Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* TAG DIALOG */}
      {showTagDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Add Tags to Selection</h3>
            <form onSubmit={handleBatchTagSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. Wedding, Setup, Decor"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTagDialog(false)} className="px-3 py-1.5 border border-zinc-805 bg-zinc-900 rounded-lg text-xs">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-xs font-bold">Add Tags</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
