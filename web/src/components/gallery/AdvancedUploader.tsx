"use client";

import React, { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Play, Pause, RotateCw, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "QUEUED" | "UPLOADING" | "PAUSED" | "SUCCESS" | "FAILED";
  speed: string; // MB/s
  eta: string; // seconds
  error?: string;
}

interface AdvancedUploaderProps {
  albumId: string;
  onUploadComplete: () => void;
}

export default function AdvancedUploader({ albumId, onUploadComplete }: AdvancedUploaderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "warn" } | null>(null);

  // Trigger brief Toast alert helper
  const showToast = (text: string, type: "success" | "error" | "warn" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Performs a real multipart HTTP upload to the backend event-service/gallery-service
  const processUploadQueue = async (filesToProcess: UploadFile[]) => {
    for (const item of filesToProcess) {
      if (item.status !== "QUEUED") continue;

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "UPLOADING" as const, speed: "Calculating..." } : q))
      );

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("albumId", albumId);

      try {
        const startTime = Date.now();
        const response = await api.post("/gallery/items/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || item.size;
            const current = progressEvent.loaded;
            const progress = Math.round((current * 100) / total);
            
            const elapsedSecs = (Date.now() - startTime) / 1000;
            const speedBytesPerSec = elapsedSecs > 0 ? current / elapsedSecs : 0;
            const speedMBps = (speedBytesPerSec / (1024 * 1024)).toFixed(1);
            
            const remainingBytes = total - current;
            const etaSecs = speedBytesPerSec > 0 ? Math.round(remainingBytes / speedBytesPerSec) : 0;
            const etaStr = etaSecs > 0 ? `${etaSecs}s` : "0s";

            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id ? { ...q, progress, speed: `${speedMBps} MB/s`, eta: etaStr } : q
              )
            );
          },
        });

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, progress: 100, status: "SUCCESS" as const, eta: "0s", speed: "0 MB/s" } : q
          )
        );
        
        showToast(`Successfully uploaded ${item.name}`, "success");
        queryClient.invalidateQueries({ queryKey: ["albumItems", albumId] });
        queryClient.invalidateQueries({ queryKey: ["albums"] });
        onUploadComplete();
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "FAILED" as const, error: "Upload failed" } : q
          )
        );
        showToast(`Failed uploading ${item.name}`, "error");
      }
    }
  };

  const handleFiles = (files: FileList) => {
    const newItems: UploadFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Duplicate detection simulation
      const duplicateExists = queue.some((q) => q.name === file.name && q.size === file.size);
      if (duplicateExists) {
        showToast(`Duplicate file ignored: ${file.name}`, "warn");
        continue;
      }

      newItems.push({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "QUEUED",
        speed: "0 MB/s",
        eta: "Calculating..."
      });
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      // Process files asynchronously
      setTimeout(() => processUploadQueue(newItems), 50);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [queue]);

  const togglePauseResume = (id: string) => {
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextStatus: "QUEUED" | "PAUSED" = q.status === "PAUSED" ? "QUEUED" : "PAUSED";
          const updatedItem = { ...q, status: nextStatus };
          if (nextStatus === "QUEUED") {
            setTimeout(() => processUploadQueue([updatedItem]), 50);
          }
          return updatedItem;
        }
        return q;
      })
    );
  };

  const cancelUpload = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const retryUpload = (id: string) => {
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updated = { ...q, status: "QUEUED" as const, progress: 0, error: undefined };
          setTimeout(() => processUploadQueue([updated]), 50);
          return updated;
        }
        return q;
      })
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-5 right-5 z-50 p-4 border rounded-xl shadow-2xl flex items-center gap-2.5 text-xs text-zinc-150 font-bold",
              toastMessage.type === "success" ? "border-emerald-500/20 bg-emerald-950/90" : 
              toastMessage.type === "warn" ? "border-amber-500/20 bg-amber-950/90" : "border-red-500/20 bg-red-950/90"
            )}
          >
            {toastMessage.type === "success" ? <CheckCircle size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-amber-500" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop uploader field */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group",
          dragActive ? "border-purple-600 bg-purple-550/[0.01]" : "border-zinc-800 bg-[#141416]/20 hover:border-zinc-700/80"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <Upload size={32} className="text-zinc-650 group-hover:text-purple-400 transition-colors mb-3" />
        <span className="text-xs text-zinc-300 font-extrabold">Drag & Drop media assets here or <span className="text-purple-400 group-hover:underline">browse</span></span>
        <span className="text-[9.5px] text-zinc-550 mt-1.5">Supports RAW images, 4K MP4s, AVIF, and metadata extraction.</span>
      </div>

      {/* Upload queue list */}
      {queue.length > 0 && (
        <div className="border border-zinc-850 bg-[#121214]/40 rounded-2xl p-4 space-y-3.5">
          <span className="text-[9.5px] text-zinc-550 uppercase font-black tracking-widest block">Upload Queue Desk ({queue.length} files)</span>
          
          <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-none">
            {queue.map((item) => (
              <div key={item.id} className="p-3 border border-zinc-850/80 bg-zinc-950/20 rounded-xl flex items-center justify-between gap-4">
                
                {/* File summary */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[10.5px] mb-1">
                    <span className="font-extrabold text-zinc-250 truncate pr-3">{item.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="h-1 flex-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-550 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono font-bold w-8 text-right">{item.progress}%</span>
                  </div>

                  {/* Upload metrics speed / ETA */}
                  {item.status === "UPLOADING" && (
                    <div className="flex items-center gap-3 text-[8.5px] text-zinc-550 font-bold mt-1.5">
                      <span>Speed: {item.speed}</span>
                      <span>ETA: {item.eta}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 shrink-0">
                  {item.status === "UPLOADING" || item.status === "PAUSED" ? (
                    <button onClick={() => togglePauseResume(item.id)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                      {item.status === "PAUSED" ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                  ) : null}
                  
                  {item.status === "FAILED" && (
                    <button onClick={() => retryUpload(item.id)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg">
                      <RotateCw size={12} />
                    </button>
                  )}

                  <button onClick={() => cancelUpload(item.id)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg">
                    <X size={12} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
