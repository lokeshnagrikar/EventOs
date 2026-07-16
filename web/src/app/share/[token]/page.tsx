"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  Folder,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Calendar,
  Sparkles,
  Camera,
  Heart,
  Maximize2,
  Share2,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/ui/skeletons";

interface SharedAlbum {
  albumId: string;
  name: string;
  description?: string;
  eventId?: string;
  coverImage?: string;
  items: SharedItem[];
}

interface SharedItem {
  id: string;
  albumId: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  size?: number;
  format?: string;
  duration?: number;
  createdAt: string;
}

export default function PublicSharePage() {
  const { token } = useParams();

  // States
  const [album, setAlbum] = useState<SharedAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<"LOADING" | "ERROR" | "EXPIRED" | "LOCKED" | "NONE">("LOADING");
  const [errorMessage, setErrorMessage] = useState("");
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<string[]>([]);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Fetch shared album
  const fetchSharedAlbum = async (currentPasscode?: string) => {
    setLoading(true);
    setPasscodeError("");
    
    try {
      const url = `/api/v1/gallery/share/public/view/${token}`;
      const config = currentPasscode
          ? { params: { passcode: currentPasscode } }
          : {};

      const response = await axios.get(url, config);

      if (response.data?.success) {
        setAlbum(response.data.data);
        setErrorStatus("NONE");
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorData = err.response?.error || err.response?.data?.error;
      const errorCode = errorData?.code;
      const msg = errorData?.message || "Failed to fetch shared album.";

      if (status === 403 || errorCode === "PASSCODE_REQUIRED" || errorCode === "INVALID_PASSCODE") {
        setErrorStatus("LOCKED");
        if (errorCode === "INVALID_PASSCODE") {
          setPasscodeError("Incorrect passcode. Please try again.");
        }
      } else if (status === 410 || errorCode === "LINK_EXPIRED") {
        setErrorStatus("EXPIRED");
        setErrorMessage(msg);
      } else {
        setErrorStatus("ERROR");
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSharedAlbum();
    }
  }, [token]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError("Passcode is required.");
      return;
    }
    fetchSharedAlbum(passcode.trim());
  };

  // Lightbox operations
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomScale(1);
    setIsSlideshowPlaying(false);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setIsSlideshowPlaying(false);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxIndex === null || !album) return;
    const items = album.items;
    let newIndex = direction === "prev" ? lightboxIndex - 1 : lightboxIndex + 1;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
    setLightboxIndex(newIndex);
    setZoomScale(1);
  };

  // Slideshow play logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSlideshowPlaying && lightboxIndex !== null) {
      timer = setInterval(() => {
        navigateLightbox("next");
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowPlaying, lightboxIndex]);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Keyboard navigation & Esc key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) closeLightbox();
      } else if (e.key === "ArrowLeft") {
        if (lightboxIndex !== null) navigateLightbox("prev");
      } else if (e.key === "ArrowRight") {
        if (lightboxIndex !== null) navigateLightbox("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, album]);

  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Trigger simulated ZIP bulk download
  const handleBulkDownload = () => {
    if (!album) return;
    setDownloadQueue(["Initializing archive...", "Packaging photos...", "Building ZIP folder...", "Completed"]);
    const interval = setTimeout(() => {
      album.items.slice(0, 3).forEach((item) => {
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      setDownloadQueue([]);
    }, 2500);
  };

  // Render loading state
  if (loading && errorStatus === "LOADING") {
    return <LoadingScreen message="Securing Private Connection..." />;
  }

  // Render passcode locked gate
  if (errorStatus === "LOCKED") {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111113]/60 border border-zinc-850 backdrop-blur-md rounded-3xl shadow-2xl p-8 space-y-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/5 via-transparent to-transparent pointer-events-none" />
          <div className="mx-auto h-12 w-12 rounded-full bg-purple-950/30 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <KeyRound size={20} />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-base text-zinc-100">Private Studio Gallery</h2>
            <p className="text-xs text-zinc-550 leading-relaxed">Access to this memory studio is protected. Enter client passcode below.</p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-[#18181B] border border-zinc-800 rounded-xl text-center text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-purple-650 font-mono tracking-widest transition-all"
              />
              {passcodeError && (
                <p className="text-[10px] text-red-400 font-bold mt-1.5 flex items-center gap-1 justify-center">
                  <AlertCircle size={11} />
                  {passcodeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
              Unlock Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render expired link state
  if (errorStatus === "EXPIRED") {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400">
            <AlertCircle size={22} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-base text-zinc-100">Access Link Expired</h2>
            <p className="text-xs text-zinc-500 leading-normal">
              {errorMessage || "The security token for this event gallery is no longer active. Please contact the administrator for a new invite link."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error page
  if (errorStatus === "ERROR" || !album) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Folder size={20} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-base text-zinc-100">Gallery Workspace Offline</h2>
            <p className="text-xs text-zinc-500 leading-normal">
              {errorMessage || "This album share link does not exist, or you lack the correct clearance to access it."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const items = album.items || [];
  const coverUrl = album.coverImage || items[0]?.url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col selection:bg-purple-600 selection:text-white pb-12">
      
      {/* ─── HERO PARALLAX BANNER ─── */}
      <div className="h-[60vh] relative w-full flex flex-col justify-end overflow-hidden border-b border-zinc-850 select-none">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/30 to-black/40" />

        <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full space-y-4">
          <span className="text-[10px] px-3 py-1 bg-purple-650/10 border border-purple-550/20 text-purple-400 font-black uppercase tracking-wider rounded-lg inline-block">
            EventOS Shared Memories
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-serif max-w-4xl leading-tight">
            {album.name}
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed font-medium">
            {album.description || "Captured beautiful moments of love, celebrations, and events."}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => openLightbox(0)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <Play size={13} fill="currentColor" /> Play Slideshow
            </button>
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/60 backdrop-blur border border-zinc-800 text-zinc-350 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.98]"
            >
              <Download size={13} /> Download Album
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Download status popup */}
      {downloadQueue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl space-y-2 text-xs w-64">
          <div className="flex justify-between items-center">
            <span className="font-bold text-zinc-300">Preparing Zip Archive</span>
            <Loader2 className="animate-spin text-purple-500" size={13} />
          </div>
          <p className="text-[10px] text-purple-400 font-bold">{downloadQueue[downloadQueue.length - 1]}</p>
        </div>
      )}

      {/* ─── CLIENT GALLERY MEDIA GRID ─── */}
      <main className="flex-1 p-6 md:p-12 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center border-b border-zinc-850 pb-4 select-none">
          <h2 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Gallery Media Grid ({items.length} items)</h2>
          <span className="text-[9.5px] text-zinc-550 font-medium">Studio: Dream Weddings Studio</span>
        </div>

        {/* Pinterest-style masonry grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map((item, index) => {
            const isFavorite = favorites.includes(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.5) }}
                onClick={() => openLightbox(index)}
                className="group relative break-inside-avoid mb-4 rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-550/5 transition-all duration-300"
              >
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full">
                    <video src={item.url} preload="metadata" muted className="w-full h-auto object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-black/70 border border-zinc-850 flex items-center justify-center text-purple-400 group-hover:bg-purple-650 group-hover:text-white transition-all shadow-md">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover overlay overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={cn("h-7 w-7 rounded-full bg-black/50 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all", isFavorite && "text-red-500 border-red-500/20 bg-red-950/20")}
                    >
                      <Heart size={12} fill={isFavorite ? "#ef4444" : "transparent"} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-[10px] text-zinc-150 font-semibold truncate flex-1">{item.name}</p>
                    <a
                      href={item.url}
                      download={item.name}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 rounded bg-black/60 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                      title="Download"
                    >
                      <Download size={11} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="py-28 text-center border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-550 flex flex-col items-center justify-center gap-2.5">
            <ImageIcon size={36} className="text-zinc-750" />
            <div>
              <p className="font-bold text-zinc-450">Album is empty</p>
              <p className="text-xs text-zinc-650 mt-1">This shared album does not have cataloged memory assets yet.</p>
            </div>
          </div>
        )}
      </main>

      {/* Immersive Lightbox Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && items[lightboxIndex] && (
          <motion.div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm flex flex-col justify-between p-4 md:p-6 select-none"
          >
            {/* Lightbox Header */}
            <div className="flex justify-between items-center z-50">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white max-w-[240px] sm:max-w-xl truncate">
                  {items[lightboxIndex].name}
                </h2>
                <p className="text-[10px] text-zinc-550 font-mono mt-0.5">
                  Format: {items[lightboxIndex].format || "unknown"} • Size: {formatBytes(items[lightboxIndex].size)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                  className={cn("h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow", isSlideshowPlaying && "text-purple-400 border-purple-500/20 bg-purple-950/20")}
                  title="Autoplay slideshow"
                >
                  {isSlideshowPlaying ? <Pause size={14} className="animate-pulse" /> : <Play size={14} />}
                </button>
                <a
                  href={items[lightboxIndex].url}
                  download={items[lightboxIndex].name}
                  className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow"
                  title="Download File"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={closeLightbox}
                  className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lightbox Viewer Port */}
            <div className="flex-1 flex items-center justify-center relative my-4">
              {items.length > 1 && (
                <button
                  onClick={() => navigateLightbox("prev")}
                  className="absolute left-0 md:left-4 z-50 h-11 w-11 rounded-full bg-zinc-900/70 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <motion.div
                animate={{ scale: zoomScale }}
                transition={{ duration: 0.18 }}
                className="max-w-[85vw] max-h-[70vh] flex items-center justify-center"
              >
                {items[lightboxIndex].type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={items[lightboxIndex].url}
                    alt={items[lightboxIndex].name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-zinc-950"
                  />
                ) : (
                  <div className="w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden border border-zinc-950 shadow-2xl bg-black">
                    <video src={items[lightboxIndex].url} controls autoPlay className="w-full max-h-[70vh] object-contain" />
                  </div>
                )}
              </motion.div>

              {items.length > 1 && (
                <button
                  onClick={() => navigateLightbox("next")}
                  className="absolute right-0 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/70 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="flex justify-between items-center text-[10px] text-zinc-550 font-mono z-50 gap-2 shrink-0">
              <span className="hidden sm:inline">Secure Public Access • EventOS Studio Link</span>
              <span className="bg-zinc-900/85 border border-zinc-800/80 px-3.5 py-1 rounded-full text-zinc-400 font-bold">
                Item {lightboxIndex + 1} of {items.length}
              </span>
              <span>Captured: {new Date(items[lightboxIndex].createdAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
