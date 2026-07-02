"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Download,
  Share2,
  Heart,
  Trash2,
  Calendar,
  Layers,
  HardDrive
} from "lucide-react";
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

interface EXIFLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavorite: (itemId: string, favorite: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  readOnly?: boolean;
}

export default function EXIFLightbox({
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onToggleFavorite,
  onDeleteItem,
  readOnly = false
}: EXIFLightboxProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  const activeItem = items[currentIndex];

  // 1. Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // 2. Slideshow Autoplay timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSlideshowPlaying) {
      timer = setInterval(() => {
        onNext();
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowPlaying, onNext]);

  if (!activeItem) return null;

  // EXIF / Metadata simulation values
  const resolution = activeItem.type === "IMAGE" ? "3840 x 2160" : "1920 x 1080";
  const sizeMB = activeItem.size ? (activeItem.size / (1024 * 1024)).toFixed(2) : "4.5";
  const publicId = activeItem.publicId || `demo-public-${activeItem.id.substring(0, 8)}`;
  const format = activeItem.format || (activeItem.type === "VIDEO" ? "mp4" : "jpg");
  const uploader = "Admin Operator";

  return (
    <div className="fixed inset-0 z-50 bg-black/98 flex flex-col md:flex-row select-none">
      
      {/* ─── MAIN PORT VIEW (IMAGE/VIDEO DISPLAY) ─── */}
      <div className="flex-1 flex flex-col relative justify-center items-center overflow-hidden">
        
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="flex bg-black/40 backdrop-blur border border-zinc-850 p-1 rounded-xl gap-1">
            <button onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white" title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button onClick={() => setZoomScale((s) => Math.max(1, s - 0.25))} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white" title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white" title="Slideshow autoplay">
              {isSlideshowPlaying ? <Pause size={14} className="text-purple-400 animate-pulse" /> : <Play size={14} />}
            </button>
          </div>

          <div className="flex bg-black/40 backdrop-blur border border-zinc-850 p-1 rounded-xl gap-1">
            <button onClick={() => onToggleFavorite(activeItem.id, !activeItem.favorite)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-350 hover:text-red-500">
              <Heart size={14} fill={activeItem.favorite ? "#ef4444" : "transparent"} className={cn(activeItem.favorite && "text-red-500")} />
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-350 hover:text-white">
              <Info size={14} />
            </button>
            {!readOnly && (
              <button onClick={() => onDeleteItem(activeItem.id)} className="p-2 hover:bg-zinc-900 hover:bg-red-500/10 rounded-lg text-zinc-350 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-350 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Navigation buttons */}
        <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full flex items-center justify-center z-20">
          <ChevronLeft size={20} />
        </button>
        <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/40 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full flex items-center justify-center z-20">
          <ChevronRight size={20} />
        </button>

        {/* Media Frame wrapper */}
        <motion.div
          animate={{ scale: zoomScale }}
          transition={{ duration: 0.18 }}
          className="max-h-[85%] max-w-[85%] flex items-center justify-center z-10"
        >
          {activeItem.type === "VIDEO" ? (
            <video src={activeItem.url} controls autoPlay className="max-h-full max-w-full rounded-xl border border-zinc-850" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeItem.url} alt={activeItem.name} className="max-h-full max-w-full rounded-xl border border-zinc-850 object-contain shadow-2xl" />
          )}
        </motion.div>
      </div>

      {/* ─── COLLAPSIBLE EXIF SIDEBAR ─── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "320px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-[320px] shrink-0 border-l border-zinc-850 bg-[#0c0c0e]/95 backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto text-xs text-zinc-350"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <span className="text-[10px] text-zinc-550 font-black uppercase tracking-widest">EXIF Info & Specs</span>
                <button onClick={() => setShowSidebar(false)} className="text-zinc-500 hover:text-white">
                  &times;
                </button>
              </div>

              {/* Title & Preview */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-zinc-200 text-sm leading-snug truncate">{activeItem.name}</h4>
                <span className="text-[8px] text-zinc-550 uppercase font-black tracking-widest">{activeItem.type} file</span>
              </div>

              {/* EXIF Metadata parameters */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Maximize2 size={13} className="text-zinc-550 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-zinc-550 uppercase font-bold block">Resolution</span>
                    <span className="font-bold text-zinc-200">{resolution}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HardDrive size={13} className="text-zinc-550 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-zinc-550 uppercase font-bold block">File Size & Format</span>
                    <span className="font-bold text-zinc-200 font-mono">{sizeMB} MB ({format.toUpperCase()})</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={13} className="text-zinc-550 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-zinc-550 uppercase font-bold block">Upload Date</span>
                    <span className="font-bold text-zinc-200">{new Date(activeItem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Layers size={13} className="text-zinc-550 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-zinc-550 uppercase font-bold block">CDN Public ID</span>
                    <span className="font-mono text-zinc-400 break-all select-all block bg-zinc-950/40 p-1 border border-zinc-900 rounded">{publicId}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-zinc-850/60 pt-4">
                  <span className="text-[9px] text-zinc-550 uppercase font-bold">Uploaded by: {uploader}</span>
                </div>
              </div>
            </div>

            {/* Close footer link */}
            <div className="border-t border-zinc-850/60 pt-4 flex justify-between items-center text-[10px] text-zinc-500">
              <span>Security Locked</span>
              <span>CDN Live</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
