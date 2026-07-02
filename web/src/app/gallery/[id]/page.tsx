"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Trash2,
  Share2,
  AlertCircle,
  ExternalLink,
  Plus,
  Loader2,
  X,
  Layers,
  ChevronRight,
  Info,
  QrCode,
  Tag,
  Maximize2,
  HardDrive,
  Calendar,
  Sparkles,
  Heart,
  MessageSquare,
  Send,
  Eye,
  Download,
  ShieldAlert,
  FolderSync,
  Clock
} from "lucide-react";
import AdvancedUploader from "@/components/gallery/AdvancedUploader";
import MasonryGallery from "@/components/gallery/MasonryGallery";
import EXIFLightbox from "@/components/gallery/EXIFLightbox";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface Album {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  itemCount: number;
  thumbnailUrl?: string;
  coverImage?: string;
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
  favorite?: boolean;
  category?: string;
  tags?: string[];
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
  allowDownload?: boolean;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  likes: number;
}

export default function AlbumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const isStaff = useMemo(() => {
    const role = user?.role || (typeof window !== 'undefined' ? localStorage.getItem("user_role") : null);
    console.log("DEBUG [AlbumDetailPage]: Resolved User Role:", role);
    return role === "OWNER" || role === "ADMIN" || role === "MANAGER" || role === "STAFF";
  }, [user]);

  // Filters & Views
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Custom sidebar active tab: "specs" | "comments" | "sharing" | "recycle"
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"specs" | "comments" | "sharing" | "recycle">("specs");

  // Selection states (for details side panel)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Dialog actions
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);
  
  // Form states
  const [commentInput, setCommentInput] = useState("");

  // Share form states
  const [shareWatermark, setShareWatermark] = useState(false);
  const [sharePasscode, setSharePasscode] = useState("");
  const [shareExpiryHours, setShareExpiryHours] = useState("168");
  const [shareDownloadAllowed, setShareDownloadAllowed] = useState(true);
  const [shareSuccessToken, setShareSuccessToken] = useState("");

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

  // 3. Fetch Events
  const { data: eventsResponse } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  // 4. Fetch Share Links for this Album
  const { data: shareLinksResponse, refetch: refetchShareLinks } = useQuery<{ data: ShareLink[] }>({
    queryKey: ["shareLinks", id],
    queryFn: async () => {
      const response = await api.get(`/gallery/share/album/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  const album = albumResponse?.data;
  const rawItems = itemsResponse?.data || [];
  const events = eventsResponse?.data || [];
  const shareLinks = shareLinksResponse?.data || [];

  const associatedEvent = events.find((e) => e.id === album?.eventId);

  // Split normal items from soft-deleted Recycle Bin items
  const activeItems = useMemo(() => {
    return rawItems.filter((item) => item.category !== "DELETED_BIN");
  }, [rawItems]);

  const deletedItems = useMemo(() => {
    return rawItems.filter((item) => item.category === "DELETED_BIN");
  }, [rawItems]);

  const items = useMemo(() => {
    return activeItems.filter((item) => {
      if (filter === "IMAGE") return item.type === "IMAGE";
      if (filter === "VIDEO") return item.type === "VIDEO";
      return true;
    });
  }, [activeItems, filter]);

  // Active item selection details
  const activeDetailItem = useMemo(() => {
    if (!selectedItemId) return items[0] || null;
    return rawItems.find((i) => i.id === selectedItemId) || items[0] || null;
  }, [rawItems, items, selectedItemId]);

  // Exif Specs Math (Mock)
  const exifData = useMemo(() => {
    if (!activeDetailItem) return null;
    const isVid = activeDetailItem.type === "VIDEO";
    return {
      camera: isVid ? "Sony FX3 Cinema Camera" : "Canon EOS R5",
      lens: isVid ? "Sony FE 35mm f/1.4 GM" : "Canon RF 85mm f/1.2L USM",
      specs: isVid ? "Shutter 1/50 • ISO 640" : "Aperture f/1.2 • Shutter 1/250 • ISO 100",
      colors: isVid ? ["#0f172a", "#3b82f6", "#1e293b"] : ["#a855f7", "#ec4899", "#3b82f6", "#f4f4f5"]
    };
  }, [activeDetailItem]);

  // Mock comments log per asset
  const [commentsList, setCommentsList] = useState<Record<string, Comment[]>>({});
  const activeComments = useMemo(() => {
    if (!activeDetailItem) return [];
    return commentsList[activeDetailItem.id] || [
      { id: "1", author: "Lead Coordinator", text: "Stunning frame! Perfect lighting setup.", createdAt: "2 hours ago", likes: 2 },
      { id: "2", author: "Client", text: "Can we get this in higher resolution?", createdAt: "1 hour ago", likes: 0 }
    ];
  }, [activeDetailItem, commentsList]);

  // ── MUTATIONS ──
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, favorite }: { itemId: string; favorite: boolean }) => {
      const response = await api.patch(`/gallery/items/${itemId}/favorite?favorite=${favorite}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
    }
  });

  // Soft Delete (Recycle Bin transfer)
  const softDeleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.put(`/gallery/items/${itemId}/organization`, {
        category: "DELETED_BIN"
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
    }
  });

  // Restore Soft Delete
  const restoreItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.put(`/gallery/items/${itemId}/organization`, {
        category: "MOVED" // Restore to normal
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
    }
  });

  // Permanent Delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/gallery/items/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/gallery/albums/${id}`);
      return response.data;
    },
    onSuccess: () => {
      router.push("/gallery");
    }
  });

  const createShareLinkMutation = useMutation({
    mutationFn: async (payload: { albumId: string; expiresInHours?: number; password?: string; allowDownload?: boolean }) => {
      const response = await api.post("/gallery/share", payload);
      return response.data;
    },
    onSuccess: (res) => {
      setShareSuccessToken(res.data.token);
      refetchShareLinks();
    }
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await api.delete(`/gallery/share/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      refetchShareLinks();
    }
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeDetailItem) return;

    const newComment: Comment = {
      id: Math.random().toString(),
      author: "Operator Admin",
      text: commentInput,
      createdAt: "Just now",
      likes: 0
    };

    setCommentsList((prev) => ({
      ...prev,
      [activeDetailItem.id]: [...activeComments, newComment]
    }));
    setCommentInput("");
  };

  const handleCreateShareLink = (e: React.FormEvent) => {
    e.preventDefault();
    createShareLinkMutation.mutate({
      albumId: id as string,
      expiresInHours: parseFloat(shareExpiryHours) || undefined,
      password: sharePasscode.trim() ? sharePasscode : undefined,
      allowDownload: shareDownloadAllowed
    });
    setSharePasscode("");
  };

  // Bulk Operations
  const handleBulkDelete = (itemIds: string[]) => {
    itemIds.forEach((itemId) => softDeleteMutation.mutate(itemId));
  };

  const handleMoveItems = (itemIds: string[], targetAlbumId: string) => {
    itemIds.forEach(async (itemId) => {
      try {
        await api.put(`/gallery/items/${itemId}/organization`, { category: "MOVED" });
      } catch (err) {
        console.error(err);
      }
    });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["albumItems", id] }), 300);
  };

  const handleCopyItems = (itemIds: string[], targetAlbumId: string) => {
    itemIds.forEach(async (itemId) => {
      try {
        await api.put(`/gallery/items/${itemId}/organization`, { category: "COPIED" });
      } catch (err) {
        console.error(err);
      }
    });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["albumItems", id] }), 300);
  };

  const handleBatchTagItems = (itemIds: string[], tags: string[]) => {
    itemIds.forEach(async (itemId) => {
      try {
        await api.put(`/gallery/items/${itemId}/organization`, { tags: new Set(tags) });
      } catch (err) {
        console.error(err);
      }
    });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["albumItems", id] }), 300);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (albumError) {
    return (
      <div className="min-h-screen bg-background text-zinc-100 flex flex-col items-center justify-center p-6 gap-3">
        <AlertCircle className="text-red-500 animate-bounce" size={48} />
        <h2 className="font-bold text-sm">Failed to retrieve album details</h2>
        <button onClick={() => router.push("/gallery")} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300">
          Return to Galleries
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200 select-none">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/gallery")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to galleries"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm max-w-[150px] sm:max-w-[200px] truncate">{album?.name || "Album Assets"}</span>
            <span className="text-[9.5px] px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold font-mono">
              {items.length} Files
            </span>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={() => { setShowSidebar(true); setSidebarTab("sharing"); }}
              className="flex items-center gap-1.5 h-8 px-3 border border-zinc-800 hover:border-purple-500/30 hover:bg-purple-500/5 text-zinc-450 hover:text-purple-400 rounded-xl font-bold transition-all"
            >
              <Share2 size={13} />
              Share Album
            </button>
            
            <button
              onClick={() => { setShowSidebar(true); setSidebarTab("recycle"); }}
              className="flex items-center gap-1.5 h-8 px-3 border border-zinc-800 hover:border-amber-500/30 hover:bg-amber-500/5 text-zinc-450 hover:text-amber-400 rounded-xl font-bold transition-all"
            >
              <FolderSync size={13} />
              Recycle Bin ({deletedItems.length})
            </button>

            <button
              onClick={() => setShowDeleteAlbumModal(true)}
              className="flex items-center gap-1.5 h-8 px-3 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-450 hover:text-red-400 rounded-xl font-bold transition-all"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </nav>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Masonry Grid + Uploader */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto min-w-0">
          
          {/* Album summary bar */}
          <div className="bg-[#111113]/40 border border-zinc-800/60 p-4.5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-base font-extrabold text-zinc-200">{album?.name}</h1>
              <p className="text-[11px] text-zinc-450 mt-1 max-w-xl leading-relaxed">
                {album?.description || "No description set."}
              </p>
            </div>
            {associatedEvent && (
              <a
                href={`/events/${associatedEvent.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-955/20 hover:bg-purple-955/40 border border-purple-900/30 text-purple-400 hover:text-purple-300 rounded-xl text-[10.5px] font-bold transition-all"
              >
                <Layers size={12} />
                <span>Event Workspace</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Cloudinary Drag & Drop Uploader */}
          {isStaff && (
            <AdvancedUploader
              albumId={id as string}
              onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["albumItems", id] })}
            />
          )}

          {/* Media Format filter bar */}
          <div className="flex justify-between items-center border-b border-zinc-800 text-xs select-none">
            <div className="flex">
              {([
                { key: "ALL", label: "All Media" },
                { key: "IMAGE", label: "Photos Only" },
                { key: "VIDEO", label: "Videos Only" }
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold border-b-2 transition-all",
                    filter === t.key ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-550 hover:text-zinc-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pinterest style Masonry Gallery */}
          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-[3/4] bg-[#161618]/25 border border-zinc-850 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <MasonryGallery
              items={items}
              albums={[]}
              onSelectItem={(idx) => {
                setLightboxIndex(idx);
                setSelectedItemId(items[idx]?.id);
              }}
              onToggleFavorite={(itemId, fav) => toggleFavoriteMutation.mutate({ itemId, favorite: fav })}
              onDeleteItems={handleBulkDelete}
              onMoveItems={handleMoveItems}
              onCopyItems={handleCopyItems}
              onBatchTagItems={handleBatchTagItems}
            />
          )}

        </div>

        {/* Right Side Collapsible Sidebar Panel */}
        {showSidebar && (
          <div className="w-80 shrink-0 border-l border-zinc-850 bg-[#0c0c0e]/90 backdrop-blur-md flex flex-col overflow-hidden text-xs text-zinc-350 select-none">
            
            {/* Tab navigation headers */}
            <div className="flex border-b border-zinc-850 bg-zinc-950/20 p-1 gap-1">
              {[
                { key: "specs", label: "Specs", icon: Info },
                { key: "comments", label: "Collaborate", icon: MessageSquare },
                { key: "sharing", label: "Secure Share", icon: Share2 },
                { key: "recycle", label: "Recycle", icon: FolderSync }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSidebarTab(tab.key as any)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] transition-all",
                      sidebarTab === tab.key ? "bg-zinc-900 border border-zinc-800 text-purple-400" : "text-zinc-550 hover:text-zinc-300"
                    )}
                    title={tab.label}
                  >
                    <Icon size={12} />
                  </button>
                );
              })}
              <button onClick={() => setShowSidebar(false)} className="p-1 text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {/* Tab contents wrapper */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB A: SPECIFICATIONS EXIF METADATA */}
              {sidebarTab === "specs" && (
                <div className="space-y-5">
                  {activeDetailItem ? (
                    <>
                      <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-zinc-850">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeDetailItem.url} alt={activeDetailItem.name} className="object-contain h-full w-full" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-zinc-200 text-xs truncate">{activeDetailItem.name}</h4>
                        <span className="text-[8.5px] text-zinc-550 uppercase font-black tracking-widest">{activeDetailItem.type} file</span>
                      </div>

                      {/* exif specs parameters */}
                      {exifData && (
                        <div className="space-y-3.5 border-t border-zinc-850/60 pt-4">
                          <div className="flex items-start gap-2.5">
                            <Maximize2 size={13} className="text-zinc-550 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-black">Dimensions & Format</span>
                              <p className="font-bold text-zinc-250 mt-0.5">{activeDetailItem.format?.toUpperCase() || "JPG"} &bull; 3840 x 2160</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <HardDrive size={13} className="text-zinc-550 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-black">Memory size</span>
                              <p className="font-bold text-zinc-250 mt-0.5">{(activeDetailItem.size ? activeDetailItem.size / (1024 * 1024) : 4.5).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Tag size={13} className="text-zinc-550 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-black">EXIF Camera Configuration</span>
                              <p className="font-bold text-zinc-250 mt-0.5">{exifData.camera}</p>
                              <p className="text-[9.5px] text-zinc-450 font-mono mt-0.5">{exifData.lens}</p>
                              <p className="text-[9px] text-purple-400 font-bold font-mono mt-0.5">{exifData.specs}</p>
                            </div>
                          </div>

                          {/* simulated dominant color extraction */}
                          <div className="space-y-1.5 border-t border-zinc-850/60 pt-3">
                            <span className="text-[8px] text-zinc-550 uppercase font-black">Dominant Color Palette</span>
                            <div className="flex gap-2">
                              {exifData.colors.map((c, i) => (
                                <div key={i} className="h-4 w-4 rounded-full border border-zinc-900 shadow-sm" style={{ backgroundColor: c }} title={c} />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 border-t border-zinc-850/60 pt-3">
                            <Calendar size={13} className="text-zinc-550 mt-0.5" />
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-black">CDN Live Details</span>
                              <p className="font-mono text-[9px] text-zinc-500 break-all select-all mt-0.5 bg-zinc-950/40 p-1 border border-zinc-900 rounded">
                                {activeDetailItem.publicId || `demo-public-${activeDetailItem.id.substring(0, 8)}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-zinc-550 italic text-center py-6">Select a media asset card to view details.</p>
                  )}
                </div>
              )}

              {/* TAB B: COLLABORATION COMMENTS */}
              {sidebarTab === "comments" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-850 pb-2">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Client Review Logs</span>
                  </div>

                  <div className="space-y-3.5 max-h-[260px] overflow-y-auto scrollbar-none pr-1">
                    {activeComments.map((c) => (
                      <div key={c.id} className="p-2.5 bg-zinc-900/30 border border-zinc-850 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-zinc-300">{c.author}</span>
                          <span className="text-zinc-550 text-[9px]">{c.createdAt}</span>
                        </div>
                        <p className="text-zinc-400 text-[10.5px] leading-relaxed">"{c.text}"</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePostComment} className="flex gap-1.5 pt-2 border-t border-zinc-850">
                    <input
                      type="text"
                      placeholder="Add review comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#121214] border border-zinc-800 rounded-lg text-white"
                    />
                    <button type="submit" className="p-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg">
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB C: SECURE SHARING SETTINGS */}
              {sidebarTab === "sharing" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-850 pb-2">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Secure Link Engine</span>
                  </div>

                  <form onSubmit={handleCreateShareLink} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-550 uppercase font-black">Link Expiration</label>
                      <select
                        value={shareExpiryHours}
                        onChange={(e) => setShareExpiryHours(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300"
                      >
                        <option value="24">24 Hours</option>
                        <option value="168">7 Days</option>
                        <option value="0">Never Expire</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-550 uppercase font-black">Access Passcode Lock</label>
                      <input
                        type="text"
                        placeholder="Optional passcode lock..."
                        value={sharePasscode}
                        onChange={(e) => setSharePasscode(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#121214] border border-zinc-800 rounded-lg text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="watermark-check"
                        checked={shareWatermark}
                        onChange={(e) => setShareWatermark(e.target.checked)}
                      />
                      <label htmlFor="watermark-check" className="font-bold text-zinc-400">Overlay Studio Watermark</label>
                    </div>

                    <button type="submit" className="w-full py-1.5 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow">
                      Generate share token
                    </button>
                  </form>

                  {shareSuccessToken && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl space-y-2 text-center">
                      <p className="text-[10px] font-bold">Secure Link Generated Successfully!</p>
                      <p className="font-mono text-[9px] break-all select-all block bg-zinc-950 p-1.5 rounded text-zinc-300">
                        {typeof window !== "undefined" && `${window.location.origin}/share/${shareSuccessToken}`}
                      </p>
                      <div className="h-20 w-20 mx-auto bg-white p-1 rounded border border-zinc-800 flex items-center justify-center mt-2 shadow">
                        <QrCode size={64} className="text-black" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB D: RECYCLE BIN PANEL */}
              {sidebarTab === "recycle" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-850 pb-2">
                    <span className="text-[9px] text-zinc-550 font-black uppercase">Soft Deleted Items</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                    {deletedItems.map((item) => (
                      <div key={item.id} className="p-2.5 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center gap-3">
                        <div className="h-10 w-10 bg-zinc-950 rounded overflow-hidden flex items-center justify-center shrink-0 border border-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.name} className="object-cover h-full w-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-300 truncate text-[10px]">{item.name}</p>
                          <p className="text-[8.5px] text-rose-450 font-bold flex items-center gap-0.5 mt-0.5">
                            <Clock size={10} /> 30-Day Cleanup
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => restoreItemMutation.mutate(item.id)}
                            className="p-1 bg-zinc-950 border border-zinc-900 hover:bg-zinc-800 text-purple-400 rounded-lg text-[9px] font-bold"
                            title="Restore to album"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => permanentDeleteMutation.mutate(item.id)}
                            className="p-1 bg-zinc-950 border border-zinc-900 hover:bg-red-500/10 text-red-500 rounded-lg text-[9px] font-bold"
                            title="Permanently delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {deletedItems.length === 0 && (
                      <p className="text-zinc-550 italic text-center py-6">Recycle bin is empty.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* LIGHTBOX SLIDESHOW COMPONENT */}
      {lightboxIndex !== null && items[lightboxIndex] && (
        <EXIFLightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((prev) => (prev === null || prev === items.length - 1 ? 0 : prev + 1))}
          onPrev={() => setLightboxIndex((prev) => (prev === null || prev === 0 ? items.length - 1 : prev - 1))}
          onToggleFavorite={(itemId, favorite) => toggleFavoriteMutation.mutate({ itemId, favorite })}
          onDeleteItem={(itemId) => {
            softDeleteMutation.mutate(itemId);
            setLightboxIndex(null);
          }}
        />
      )}

      {/* DELETE CONFIRM ALBUM DIALOG */}
      {showDeleteAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 relative">
            <h3 className="font-bold text-base text-red-400 mb-2">Delete Album?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">This action cannot be undone and will delete all photos and videos from Cloudinary.</p>
            <div className="flex justify-end gap-3 text-xs">
              <button onClick={() => setShowDeleteAlbumModal(false)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAlbumMutation.mutate();
                  setShowDeleteAlbumModal(false);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Delete Album
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
