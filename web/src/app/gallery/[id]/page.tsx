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
  Clock,
  Copy,
  Check,
  ShieldCheck
} from "lucide-react";
import AdvancedUploader from "@/components/gallery/AdvancedUploader";
import MasonryGallery from "@/components/gallery/MasonryGallery";
import EXIFLightbox from "@/components/gallery/EXIFLightbox";
import ShareQrModal from "@/components/gallery/ShareQrModal";
import { cn, getAppBaseUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/lib/toastStore";
import { LoadingScreen } from "@/components/ui/skeletons";

interface Album {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  itemCount: number;
  thumbnailUrl?: string;
  coverImage?: string;
  createdAt: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility?: "PUBLIC" | "PRIVATE";
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
  const { user, memberships, activeTenantId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const activeMembership = memberships.find((m) => m.tenantId === activeTenantId);
  const defaultAgencyName = activeMembership?.companyName || (user?.firstName ? `${user.firstName}'s Studio` : "EventOS Preview");

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
  const [shareWatermarkText, setShareWatermarkText] = useState("");
  const [sharePasscode, setSharePasscode] = useState("");
  const [shareExpiryHours, setShareExpiryHours] = useState("168");
  const [shareDownloadAllowed, setShareDownloadAllowed] = useState(true);
  const [shareSuccessToken, setShareSuccessToken] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

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
  const rawItems = useMemo(() => itemsResponse?.data || [], [itemsResponse]);
  const events = useMemo(() => eventsResponse?.data || [], [eventsResponse]);
  const shareLinks = useMemo(() => shareLinksResponse?.data || [], [shareLinksResponse]);

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
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["albumItems", id] });
      addToast(variables.favorite ? "Item added to favorites" : "Item removed from favorites", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to toggle favorite";
      addToast(msg, "error");
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
      addToast("Item moved to Recycle Bin", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to move item to Recycle Bin";
      addToast(msg, "error");
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
      addToast("Item restored to album", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to restore item";
      addToast(msg, "error");
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
      addToast("Item permanently deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to delete item";
      addToast(msg, "error");
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/gallery/albums/${id}`);
      return response.data;
    },
    onSuccess: () => {
      router.push("/gallery");
      addToast("Album deleted", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to delete album";
      addToast(msg, "error");
    }
  });

  const createShareLinkMutation = useMutation({
    mutationFn: async (payload: { albumId: string; expiresInHours?: number; password?: string; allowDownload?: boolean; watermark?: boolean; watermarkText?: string }) => {
      const response = await api.post("/gallery/share", payload);
      return response.data;
    },
    onSuccess: (res) => {
      setShareSuccessToken(res.data.token);
      refetchShareLinks();
      addToast("Secure share link generated", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to generate share link";
      addToast(msg, "error");
    }
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await api.delete(`/gallery/share/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      refetchShareLinks();
      addToast("Share link revoked", "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to revoke share link";
      addToast(msg, "error");
    }
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (vis: "PUBLIC" | "PRIVATE") => {
      if (!album) return;
      const response = await api.put(`/gallery/albums/${id}`, {
        name: album.name,
        description: album.description,
        eventId: album.eventId || undefined,
        coverImage: album.coverImage || undefined,
        status: album.status || "PUBLISHED",
        visibility: vis
      });
      return response.data;
    },
    onSuccess: (res, vis) => {
      queryClient.invalidateQueries({ queryKey: ["album", id] });
      addToast(`Album visibility set to ${vis} ✓`, "success");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to update visibility";
      addToast(msg, "error");
    }
  });

  const activeToken = shareSuccessToken || (shareLinks.length > 0 ? shareLinks[0].token : null);
  const currentShareUrl = activeToken
    ? `${getAppBaseUrl()}/share/${activeToken}`
    : `${getAppBaseUrl()}/gallery/${id}`;

  const currentQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    currentShareUrl
  )}&color=09090b&bgcolor=ffffff&qzone=2`;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedShareUrl(true);
    addToast("Share link copied to clipboard!", "success");
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const res = await fetch(currentQrCodeUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(album?.name || "album").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      addToast("QR Code PNG downloaded!", "success");
    } catch {
      window.open(currentQrCodeUrl, "_blank");
      addToast("QR Code opened in new tab", "info");
    }
  };

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
      allowDownload: shareDownloadAllowed,
      watermark: shareWatermark,
      watermarkText: shareWatermark ? (shareWatermarkText.trim() || defaultAgencyName) : undefined
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
    return <LoadingScreen message="Unlocking Album Vault..." />;
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
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/10 cursor-pointer"
            >
              <QrCode size={13} />
              Share & QR Code
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
          <div className="bg-[#111113]/70 backdrop-blur border border-zinc-800/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg shadow-black/20">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-black text-white tracking-tight">{album?.name}</h1>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5",
                    album?.visibility === "PUBLIC"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      album?.visibility === "PUBLIC" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    )}
                  />
                  {album?.visibility === "PUBLIC" ? "Public • Downloads ON" : "Private • Locked"}
                </span>
                {album?.status && (
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-800/90 text-zinc-400 rounded-md border border-zinc-700/50">
                    {album.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                {album?.description || "No description set for this album."}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {associatedEvent && (
                <a
                  href={`/events/${associatedEvent.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-955/20 hover:bg-purple-955/40 border border-purple-900/30 text-purple-400 hover:text-purple-300 rounded-xl text-[11px] font-bold transition-all shadow-sm"
                >
                  <Layers size={13} />
                  <span>Event Workspace</span>
                  <ExternalLink size={10} />
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-purple-600/15 cursor-pointer active:scale-95"
              >
                <QrCode size={13} />
                <span>Share & QR</span>
              </button>
            </div>
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
                  <div className="border-b border-zinc-850 pb-2 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Secure Link Engine</span>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="text-[9.5px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 size={11} /> Full Portal
                    </button>
                  </div>

                  {/* Real Scannable QR Code Card */}
                  <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/70 border border-zinc-800/90 rounded-2xl space-y-3 shadow-inner">
                    <div className="p-2 bg-white rounded-xl shadow-xl border border-zinc-700/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQrCodeUrl}
                        alt="Real Scannable Album QR Code"
                        className="w-28 h-28 object-contain block select-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-black block">
                        Live Scannable QR Code
                      </span>
                      <p className="text-[10px] text-zinc-400">Scan with any phone camera to access album</p>
                    </div>

                    <div className="flex gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="flex-1 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                      >
                        <Download size={12} /> Save QR PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(currentShareUrl)}
                        className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-750 text-zinc-200 border border-zinc-750 rounded-lg font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        {copiedShareUrl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedShareUrl ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                  </div>

                  {/* Visibility & Download Permissions Banner */}
                  <div className={cn(
                    "p-3 rounded-xl border text-[10px] space-y-1.5",
                    album?.visibility === "PUBLIC"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5">
                        {album?.visibility === "PUBLIC" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {album?.visibility === "PUBLIC" ? "Public Album (Downloads ON)" : "Private Album (Downloads Locked)"}
                      </div>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => updateVisibilityMutation.mutate(album?.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
                          className="text-[9px] underline font-bold cursor-pointer hover:text-white"
                        >
                          {album?.visibility === "PUBLIC" ? "Make Private" : "Make Public"}
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-400 text-[9.5px] leading-relaxed">
                      {album?.visibility === "PUBLIC"
                        ? "Public visitors can browse photos and download the full album archive."
                        : "Private mode blocks external guest viewing and downloads."}
                    </p>
                  </div>

                  {/* Create New Secure Link Form */}
                  <form onSubmit={handleCreateShareLink} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-zinc-850/60 pb-1.5">
                      <span className="text-[9.5px] font-black uppercase text-zinc-400">Generate New Token</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] text-zinc-550 uppercase font-black">Link Expiration</label>
                      <select
                        value={shareExpiryHours}
                        onChange={(e) => setShareExpiryHours(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-bold"
                      >
                        <option value="24">24 Hours (1 Day)</option>
                        <option value="168">7 Days (1 Week)</option>
                        <option value="720">30 Days (1 Month)</option>
                        <option value="0">Never Expire (Permanent)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8.5px] text-zinc-550 uppercase font-black">Access Passcode Lock (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026VIP"
                        value={sharePasscode}
                        onChange={(e) => setSharePasscode(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#121214] border border-zinc-800 rounded-lg text-white font-mono text-xs focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="font-bold text-zinc-300 text-[10px]">Allow High-Res Downloads</span>
                      <input
                        type="checkbox"
                        checked={shareDownloadAllowed}
                        onChange={(e) => setShareDownloadAllowed(e.target.checked)}
                        className="accent-purple-600 rounded h-4 w-4"
                      />
                    </div>

                    <div className="space-y-2 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-300 text-[10px]">Overlay Studio Watermark</span>
                        <input
                          type="checkbox"
                          checked={shareWatermark}
                          onChange={(e) => {
                            setShareWatermark(e.target.checked);
                            if (e.target.checked && !shareWatermarkText) {
                              setShareWatermarkText(defaultAgencyName);
                            }
                          }}
                          className="accent-purple-600 rounded h-4 w-4"
                        />
                      </div>

                      {shareWatermark && (
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">
                            Watermark Text (Agency Name)
                          </label>
                          <input
                            type="text"
                            placeholder={defaultAgencyName}
                            value={shareWatermarkText}
                            onChange={(e) => setShareWatermarkText(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#121214] border border-zinc-800 rounded-lg text-white font-mono text-xs focus:border-purple-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={createShareLinkMutation.isPending}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {createShareLinkMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
                      {createShareLinkMutation.isPending ? "Generating..." : "Generate Share Token"}
                    </button>
                  </form>

                  {/* Newly Generated Secure Link Success Banner with Real QR Code */}
                  {shareSuccessToken && (
                    <div className="p-3.5 bg-gradient-to-b from-emerald-500/15 to-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3 shadow-lg animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-400 text-[10px] flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-400" />
                          Secure Link Generated Successfully!
                        </span>
                        <button
                          type="button"
                          onClick={() => setShareSuccessToken(null)}
                          className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="p-2 bg-black/60 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] text-zinc-300 truncate select-all">
                          {`${getAppBaseUrl()}/share/${shareSuccessToken}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(`${getAppBaseUrl()}/share/${shareSuccessToken}`)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg shrink-0 cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedShareUrl ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        </button>
                      </div>

                      {/* Real Scannable QR Code */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                            `${getAppBaseUrl()}/share/${shareSuccessToken}`
                          )}&color=09090b&bgcolor=ffffff&qzone=2`}
                          alt="Real Scannable Album Share QR Code"
                          className="w-28 h-28 object-contain block select-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <Download size={11} /> Save QR
                        </button>
                        <a
                          href={`${getAppBaseUrl()}/share/${shareSuccessToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <ExternalLink size={11} /> Open Link
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Active Tokens List */}
                  {shareLinks.length > 0 && (
                    <div className="space-y-2 border-t border-zinc-850 pt-3">
                      <span className="text-[9px] font-black uppercase text-zinc-500 block">
                        Active Share Tokens ({shareLinks.length})
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {shareLinks.map((link) => (
                          <div
                            key={link.id}
                            className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between gap-2 text-[10px]"
                          >
                            <div className="truncate">
                              <span className="font-mono text-purple-400 truncate block">.../share/{link.token.substring(0, 10)}...</span>
                              <span className="text-[8px] text-zinc-550">
                                {link.expiresAt ? `Exp: ${new Date(link.expiresAt).toLocaleDateString()}` : "Permanent"}
                                {link.passwordProtected && " • 🔒 Protected"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(`${getAppBaseUrl()}/share/${link.token}`)}
                                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
                                title="Copy Token URL"
                              >
                                <Copy size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => revokeShareLinkMutation.mutate(link.id)}
                                className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer"
                                title="Revoke Token"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
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

      {/* SHARE & LIVE SCANNABLE QR CODE MODAL */}
      {showShareModal && album && (
        <ShareQrModal
          album={{
            id: album.id,
            name: album.name,
            description: album.description,
            itemCount: album.itemCount || items.length,
            visibility: album.visibility || "PUBLIC",
            status: album.status || "PUBLISHED"
          }}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onUpdateVisibility={(vis) => updateVisibilityMutation.mutate(vis)}
        />
      )}

    </div>
  );
}
