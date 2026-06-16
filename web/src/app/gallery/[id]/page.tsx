"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  Share2,
  Copy,
  Check,
  Clock,
  Lock,
  Unlock,
  ShieldAlert
} from "lucide-react";

interface Album {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  itemCount: number;
  thumbnailUrl?: string;
  createdAt: string;
}

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
}

interface Event {
  id: string;
  name: string;
}

interface ShareLink {
  id: string;
  albumId: string;
  token: string;
  expiresAt: string | null;
  passwordProtected: boolean;
  createdAt: string;
  expired: boolean;
}

export default function AlbumDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout & Filter States
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "MASONRY">("GRID");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [expiryHours, setExpiryHours] = useState<string>("168"); // Default 7 days
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [shareError, setShareError] = useState("");

  // Upload progress states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // 1. Fetch Album metadata
  const { data: albumResponse, isLoading: albumLoading, error: albumError } = useQuery<{ data: Album }>({
    queryKey: ["album", id],
    queryFn: async () => {
      const response = await api.get(`/gallery/albums/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  // 2. Fetch Media items in Album
  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<{ data: GalleryItem[] }>({
    queryKey: ["albumItems", id],
    queryFn: async () => {
      const response = await api.get(`/gallery/items/album/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  // 3. Fetch Events (to find associated event name)
  const { data: eventsResponse } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  // 4. Fetch Share Links for this Album (only when share modal is open)
  const { data: shareLinksResponse, refetch: refetchShareLinks } = useQuery<{ data: ShareLink[] }>({
    queryKey: ["shareLinks", id],
    queryFn: async () => {
      const response = await api.get(`/gallery/share/album/${id}`);
      return response.data;
    },
    enabled: !!id && showShareModal
  });

  const album = albumResponse?.data;
  const rawItems = itemsResponse?.data || [];
  const events = eventsResponse?.data || [];
  const shareLinks = shareLinksResponse?.data || [];

  const associatedEvent = events.find((e) => e.id === album?.eventId);

  // 5. Filter Items
  const items = rawItems.filter((item) => {
    if (filter === "IMAGE") return item.type === "IMAGE";
    if (filter === "VIDEO") return item.type === "VIDEO";
    return true;
  });

  // 6. Mutation: Delete individual item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/gallery/items/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    }
  });

  // 7. Mutation: Delete entire Album
  const deleteAlbumMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/gallery/albums/${id}`);
      return response.data;
    },
    onSuccess: () => {
      window.location.href = "/gallery";
    }
  });

  // 8. Mutation: Create Share Link
  const createShareLinkMutation = useMutation({
    mutationFn: async (payload: { albumId: string; expiresInHours?: number; password?: string }) => {
      const response = await api.post("/gallery/share", payload);
      return response.data;
    },
    onSuccess: () => {
      refetchShareLinks();
      setPasscode("");
      setRequirePasscode(false);
      setShareError("");
    },
    onError: (err: any) => {
      setShareError(err.response?.data?.error?.message || "Failed to create share link.");
    }
  });

  // 9. Mutation: Revoke Share Link
  const revokeShareLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await api.delete(`/gallery/share/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      refetchShareLinks();
    }
  });

  // Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setTotalFilesToUpload(files.length);
    
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i + 1);
      const file = files[i];

      // Form validation
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File ${file.name} exceeds the 50MB limit.`);
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("albumId", id as string);

      try {
        await api.post("/gallery/items/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / files.length) * 100));
      } catch (err: any) {
        setUploadError(err.response?.data?.error?.message || `Failed to upload ${file.name}.`);
        break;
      }
    }

    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
    queryClient.invalidateQueries({ queryKey: ["albums"] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (confirm("Remove this media file? This deletes it permanently from Cloudinary.")) {
      deleteItemMutation.mutate(itemId);
      setLightboxIndex(null);
    }
  };

  const handleDeleteAlbum = () => {
    if (confirm("Delete this entire album? This will purge all associated photos and videos.")) {
      deleteAlbumMutation.mutate();
    }
  };

  // Share link generation handler
  const handleGenerateShareLink = (e: React.FormEvent) => {
    e.preventDefault();
    setShareError("");

    const payload: { albumId: string; expiresInHours?: number; password?: string } = {
      albumId: id as string
    };

    if (expiryHours !== "never") {
      const hours = parseInt(expiryHours, 10);
      if (!isNaN(hours) && hours > 0) {
        payload.expiresInHours = hours;
      }
    }

    if (requirePasscode && passcode.trim()) {
      if (passcode.trim().length < 4) {
        setShareError("Passcode must be at least 4 characters.");
        return;
      }
      payload.password = passcode.trim();
    }

    createShareLinkMutation.mutate(payload);
  };

  const handleCopyLink = (token: string, linkId: string) => {
    if (typeof window !== "undefined") {
      const absoluteUrl = `${window.location.origin}/share/${token}`;
      navigator.clipboard.writeText(absoluteUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const handleRevokeLink = (linkId: string) => {
    if (confirm("Revoke this link? External clients using it will immediately lose access to the album.")) {
      revokeShareLinkMutation.mutate(linkId);
    }
  };

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (lightboxIndex === null) return;
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

  const isLoading = albumLoading || itemsLoading;

  if (albumError) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col items-center justify-center p-6 gap-3">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="font-bold text-lg">Failed to retrieve album details</h2>
        <p className="text-zinc-500 text-xs">The album may have been deleted, or you might not have permission.</p>
        <button
          onClick={() => (window.location.href = "/gallery")}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition-all border border-zinc-750"
        >
          Return to Galleries
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/gallery")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to galleries"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base max-w-[200px] truncate">{album?.name || "Album Details"}</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">
              {items.length} Files
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 hover:border-purple-500/30 hover:bg-purple-500/5 text-zinc-400 hover:text-purple-400 rounded-lg text-xs font-semibold transition-all"
          >
            <Share2 size={13} />
            Share Album
          </button>

          <button
            onClick={handleDeleteAlbum}
            disabled={deleteAlbumMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 rounded-lg text-xs font-semibold transition-all"
          >
            <Trash2 size={13} />
            Delete Album
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
          >
            {isUploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add Media
          </button>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Album Overview */}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
            <div className="h-3 bg-zinc-900 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="bg-[#111113]/40 border border-zinc-800/60 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-mono">
                Established: {album && new Date(album.createdAt).toLocaleString()}
              </p>
              <h1 className="text-xl font-extrabold text-zinc-100 mt-1">{album?.name}</h1>
              <p className="text-xs text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                {album?.description || "No description set for this album."}
              </p>
            </div>

            {associatedEvent && (
              <a
                href={`/events/${associatedEvent.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-semibold transition-all shrink-0"
              >
                <Layers size={13} />
                <span>Workspace: {associatedEvent.name}</span>
                <ExternalLink size={10} className="ml-0.5" />
              </a>
            )}
          </div>
        )}

        {/* Upload Status Banner */}
        {isUploading && (
          <div className="bg-purple-600/10 border border-purple-500/20 p-4 rounded-xl space-y-2.5">
            <div className="flex justify-between text-xs font-semibold text-purple-400">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Uploading File {currentFileIndex} of {totalFilesToUpload}...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Interrupted</p>
              <p className="mt-1 opacity-90">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800">
          <div className="flex">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                filter === "ALL"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setFilter("IMAGE")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                filter === "IMAGE"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setFilter("VIDEO")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                filter === "VIDEO"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Videos
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 p-0.5 rounded-lg mb-2 sm:mb-0">
            <button
              onClick={() => setViewMode("GRID")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                viewMode === "GRID"
                  ? "bg-purple-650 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("MASONRY")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                viewMode === "MASONRY"
                  ? "bg-purple-650 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              Masonry Columns
            </button>
          </div>
        </div>

        {/* Media Layout */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="aspect-square bg-[#161618]/25 border border-zinc-850 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {viewMode === "GRID" ? (
              /* SQUARE ASPECT GRID */
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-slide-in">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => openLightbox(index)}
                    className="group relative aspect-square rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-500/40 hover:shadow-lg transition-all"
                  >
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={item.url}
                          preload="metadata"
                          muted
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overlays / Hover Buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-all p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] px-1.5 py-0.5 bg-black/55 backdrop-blur-md rounded border border-zinc-850 font-bold uppercase tracking-wider">
                          {item.type}
                        </span>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="h-6 w-6 rounded bg-black/60 hover:bg-red-500 border border-zinc-850 hover:border-transparent flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-sm"
                          title="Delete Media"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-200 font-medium truncate w-full pr-2">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* DYNAMIC PORTRAIT/LANDSCAPE MASONRY COLUMNS GRID */
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 animate-slide-in">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => openLightbox(index)}
                    className="group relative break-inside-avoid mb-4 rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-500/40 hover:shadow-lg transition-all"
                  >
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
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
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur border border-zinc-800/80 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overlays / Hover Buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-all p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] px-1.5 py-0.5 bg-black/55 backdrop-blur-md rounded border border-zinc-850 font-bold uppercase tracking-wider">
                          {item.type}
                        </span>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="h-6 w-6 rounded bg-black/60 hover:bg-red-500 border border-zinc-850 hover:border-transparent flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-sm"
                          title="Delete Media"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-200 font-medium truncate w-full pr-2">
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="py-24 text-center border border-dashed border-zinc-850 rounded-2xl text-zinc-500 flex flex-col items-center justify-center gap-3">
                <Upload size={36} className="text-zinc-700" />
                <div>
                  <p className="font-semibold text-zinc-450">No media assets in filters</p>
                  <p className="text-xs text-zinc-650 mt-1">Upload images or videos directly to begin cataloging.</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-xs font-semibold rounded-lg text-zinc-300 transition-all"
                >
                  Upload Files
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* SHARE LINKS MANAGEMENT MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] animate-slide-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 shrink-0">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="text-purple-500" size={16} />
                Share Visual Album
              </h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareError("");
                }}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Generate Share Link */}
                <div className="space-y-4 border-b md:border-b-0 md:border-r border-zinc-800/80 pb-6 md:pb-0 md:pr-6">
                  <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Generate Share Link</h3>
                  
                  {shareError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{shareError}</span>
                    </div>
                  )}

                  <form onSubmit={handleGenerateShareLink} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-450 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Clock size={12} className="text-zinc-500" />
                        Expiration Time
                      </label>
                      <select
                        value={expiryHours}
                        onChange={(e) => setExpiryHours(e.target.value)}
                        className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white font-medium focus:outline-none focus:border-purple-600"
                      >
                        <option value="24">24 Hours (1 Day)</option>
                        <option value="168">7 Days (1 Week)</option>
                        <option value="720">30 Days (1 Month)</option>
                        <option value="never">Permanent (Never Expires)</option>
                      </select>
                    </div>

                    <div className="space-y-3 bg-zinc-950/40 border border-zinc-800/60 p-3.5 rounded-xl">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={requirePasscode}
                          onChange={(e) => {
                            setRequirePasscode(e.target.checked);
                            if (!e.target.checked) setPasscode("");
                          }}
                          className="rounded border-zinc-800 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                        />
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          {requirePasscode ? <Lock size={12} className="text-purple-400" /> : <Unlock size={12} className="text-zinc-500" />}
                          Password Protection
                        </span>
                      </label>
                      
                      {requirePasscode && (
                        <input
                          type="text"
                          required
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="Create 4+ char passcode"
                          className="w-full px-3 py-1.5 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 transition-all font-mono"
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={createShareLinkMutation.isPending}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {createShareLinkMutation.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Plus size={13} />
                      )}
                      Create Secure Link
                    </button>
                  </form>
                </div>

                {/* Right side: Active Links List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Active Share Links</h3>
                  
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {shareLinks.map((link) => {
                      const absoluteUrl = typeof window !== "undefined" 
                          ? `${window.location.origin}/share/${link.token}`
                          : `/share/${link.token}`;

                      return (
                        <div key={link.id} className="p-3 bg-[#161618]/60 border border-zinc-850/80 rounded-xl space-y-2 relative overflow-hidden group">
                          {link.expired && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-zinc-400 font-bold z-10">
                              Expired
                            </div>
                          )}

                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5 max-w-[150px] md:max-w-[180px]">
                              <p className="font-bold text-zinc-200 font-mono text-[10px] truncate" title={absoluteUrl}>
                                .../share/{link.token.substring(0, 10)}...
                              </p>
                              <p className="text-[9px] text-zinc-500 font-mono">
                                Exp: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 z-20">
                              {/* Password Indicator */}
                              {link.passwordProtected && (
                                <span className="h-6 w-6 rounded bg-zinc-850 border border-zinc-800 flex items-center justify-center text-purple-400" title="Password Protected">
                                  <Lock size={10} />
                                </span>
                              )}
                              {/* Copy Trigger */}
                              <button
                                onClick={() => handleCopyLink(link.token, link.id)}
                                className="h-6 w-6 rounded bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-sm"
                                title="Copy Address"
                              >
                                {copiedLinkId === link.id ? (
                                  <Check size={11} className="text-emerald-450" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                              {/* Revoke Trigger */}
                              <button
                                onClick={() => handleRevokeLink(link.id)}
                                className="h-6 w-6 rounded bg-zinc-850 border border-zinc-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center text-zinc-500 transition-all shadow-sm"
                                title="Revoke Access"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {shareLinks.length === 0 && (
                      <div className="py-12 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-center text-zinc-500 flex flex-col items-center justify-center gap-1.5">
                        <Lock size={20} className="text-zinc-750" />
                        <p className="font-semibold text-zinc-450">No share links established</p>
                        <p className="text-[10px] text-zinc-600">Active tokens for clients will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-zinc-800 mt-6 text-[10px] text-zinc-500 flex items-center gap-1.5 shrink-0">
              <ShieldAlert size={12} className="text-purple-500/60" />
              <span>Revoking share links invalidates client access tokens immediately. Expired links are deleted automatically.</span>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / SLIDER / VIDEO PLAYER OVERLAY */}
      {lightboxIndex !== null && items[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 md:p-6 select-none animate-fade-in">
          {/* Lightbox Header */}
          <div className="flex justify-between items-center z-50">
            <div>
              <h2 className="text-sm font-bold text-white max-w-[300px] md:max-w-xl truncate">
                {items[lightboxIndex].name}
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Size: {formatBytes(items[lightboxIndex].size)} • Format: {items[lightboxIndex].format || "unknown"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDeleteItem(e, items[lightboxIndex].id)}
                className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center text-zinc-400 transition-all shadow"
                title="Delete File"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={closeLightbox}
                className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow"
                title="Close Lightbox"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Core Player Area */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            {/* Left Shift Button */}
            {items.length > 1 && (
              <button
                onClick={() => navigateLightbox("prev")}
                className="absolute left-0 md:left-4 z-50 h-11 w-11 rounded-full bg-zinc-900/60 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                aria-label="Previous Media"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Content Switcher */}
            <div className="max-w-[85vw] max-h-[70vh] flex items-center justify-center">
              {items[lightboxIndex].type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={items[lightboxIndex].url}
                  alt={items[lightboxIndex].name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-zinc-900"
                />
              ) : (
                <div className="w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden border border-zinc-900 shadow-2xl bg-black">
                  <video
                    src={items[lightboxIndex].url}
                    controls
                    autoPlay
                    className="w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}
            </div>

            {/* Right Shift Button */}
            {items.length > 1 && (
              <button
                onClick={() => navigateLightbox("next")}
                className="absolute right-0 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/60 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                aria-label="Next Media"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Lightbox Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-zinc-500 font-mono z-50 gap-2">
            <span>
              Asset ID: {items[lightboxIndex].id}
            </span>
            <span className="bg-zinc-900/60 border border-zinc-800/60 px-3 py-1 rounded-full text-zinc-400">
              Media {lightboxIndex + 1} of {items.length}
            </span>
            <span>
              Uploaded: {new Date(items[lightboxIndex].createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
