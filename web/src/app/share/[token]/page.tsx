"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  Folder,
  Image as ImageIcon,
  Video,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SharedAlbum {
  albumId: string;
  name: string;
  description?: string;
  eventId?: string;
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
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Fetch shared album
  const fetchSharedAlbum = async (currentPasscode?: string) => {
    setLoading(true);
    setPasscodeError("");
    
    try {
      // Use standard axios to avoid JWT interceptors and redirects
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
      const errorData = err.response?.data?.error;
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
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxIndex === null || !album) return;
    const items = album.items;
    let newIndex = direction === "prev" ? lightboxIndex - 1 : lightboxIndex + 1;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
    setLightboxIndex(newIndex);
  };

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
        if (lightboxIndex !== null) setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        if (lightboxIndex !== null) navigateLightbox("prev");
      } else if (e.key === "ArrowRight") {
        if (lightboxIndex !== null) navigateLightbox("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, album]);

  // Focus Trap for Lightbox
  useEffect(() => {
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (lightboxIndex === null || !lightboxRef.current) return;

      const focusableElements = lightboxRef.current.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    if (lightboxIndex !== null) {
      setTimeout(() => {
        const firstFocusable = lightboxRef.current?.querySelector('input, select, button, a, [tabindex="0"]') as HTMLElement;
        firstFocusable?.focus();
      }, 50);
      window.addEventListener("keydown", handleFocusTrap);
    }
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [lightboxIndex]);

  // Render loading state
  if (loading && errorStatus === "LOADING") {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-150 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-purple-500" size={36} />
        <p className="text-zinc-550 text-xs font-semibold tracking-wide uppercase">Unlocking Gallery Assets...</p>
      </div>
    );
  }

  // Render passcode locked gate
  if (errorStatus === "LOCKED") {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-purple-950/40 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <KeyRound size={20} />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="font-extrabold text-base text-zinc-100">Private Gallery Access</h2>
            <p className="text-xs text-zinc-500">This album is protected. Enter the client passcode to view items.</p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Passcode"
                className="w-full px-4 py-2.5 bg-[#18181B] border border-zinc-800 rounded-xl text-center text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-650 font-mono tracking-widest transition-all"
              />
              {passcodeError && (
                <p className="text-[10px] text-red-400 font-semibold mt-1.5 flex items-center gap-1 justify-center">
                  <AlertCircle size={10} />
                  {passcodeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Unlock size={13} />
              )}
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
            <h2 className="font-extrabold text-base text-zinc-100">Sharing Link Expired</h2>
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
            <h2 className="font-extrabold text-base text-zinc-100">Gallery Not Found</h2>
            <p className="text-xs text-zinc-500 leading-normal">
              {errorMessage || "This album share link does not exist, or you lack the correct clearance to access it."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const items = album.items || [];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col selection:bg-purple-650 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-center text-purple-400">
            <Folder size={14} />
          </div>
          <div>
            <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider">Shared Event Gallery</span>
            <h2 className="font-extrabold text-sm text-white -mt-0.5 max-w-[240px] sm:max-w-md truncate" title={album.name}>
              {album.name}
            </h2>
          </div>
        </div>

        <span className="text-[10px] px-2.5 py-1 bg-zinc-900/80 border border-zinc-800/80 rounded-lg text-zinc-400 font-mono font-bold flex items-center gap-1 shadow-sm">
          {items.length} assets
        </span>
      </nav>

      {/* Main Body */}
      <main className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Album Cover Description */}
        <div className="bg-[#111113]/40 border border-zinc-800/60 p-6 rounded-2xl space-y-2">
          <h1 className="text-xl font-black text-zinc-150">{album.name}</h1>
          <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
            {album.description || "Browse photos and videos captured from this workspace."}
          </p>
        </div>

        {/* Premium Masonry Columns Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.6) }}
              onClick={() => openLightbox(index)}
              className="group relative break-inside-avoid mb-4 rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-550/5 transition-all duration-300"
            >
              {item.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-auto object-contain group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="relative w-full">
                  <video
                    src={item.url}
                    preload="metadata"
                    muted
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-black/75 backdrop-blur border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between">
                <span className="text-[9px] px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-zinc-800 font-bold uppercase tracking-wider self-start">
                  {item.type}
                </span>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-[10px] text-zinc-150 font-semibold truncate flex-1">
                    {item.name}
                  </p>
                  <a
                    href={item.url}
                    download={item.name}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 rounded bg-black/75 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    title="Download Source"
                  >
                    <Download size={11} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="py-28 text-center border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-550 flex flex-col items-center justify-center gap-2.5">
            <ImageIcon size={36} className="text-zinc-750" />
            <div>
              <p className="font-bold text-zinc-450">Album is empty</p>
              <p className="text-xs text-zinc-600 mt-1">Visual assets haven't been cataloged in this album yet.</p>
            </div>
          </div>
        )}
      </main>

      {/* PUBLIC LIGHTBOX PLAYER */}
      <AnimatePresence>
        {lightboxIndex !== null && items[lightboxIndex] && (
          <motion.div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label="Media Lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm flex flex-col justify-between p-4 md:p-6 select-none"
          >
            {/* Header */}
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
                  title="Close Full Screen"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Viewer Display */}
            <div className="flex-1 flex items-center justify-center relative my-4">
              {/* Prev Button */}
              {items.length > 1 && (
                <button
                  onClick={() => navigateLightbox("prev")}
                  className="absolute left-0 md:left-4 z-50 h-11 w-11 rounded-full bg-zinc-900/70 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Media Wrapper */}
              <div className="max-w-[85vw] max-h-[70vh] flex items-center justify-center">
                {items[lightboxIndex].type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={items[lightboxIndex].url}
                    alt={items[lightboxIndex].name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-zinc-950"
                  />
                ) : (
                  <div className="w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden border border-zinc-950 shadow-2xl bg-black">
                    <video
                      src={items[lightboxIndex].url}
                      controls
                      autoPlay
                      className="w-full max-h-[70vh] object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Next Button */}
              {items.length > 1 && (
                <button
                  onClick={() => navigateLightbox("next")}
                  className="absolute right-0 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/70 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-zinc-550 font-mono z-50 gap-2 shrink-0">
              <span className="hidden sm:inline">
                Securely shared via EventOS
              </span>
              <span className="bg-zinc-900/85 border border-zinc-800/80 px-3.5 py-1 rounded-full text-zinc-400 font-bold">
                Item {lightboxIndex + 1} of {items.length}
              </span>
              <span>
                Captured: {new Date(items[lightboxIndex].createdAt).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
