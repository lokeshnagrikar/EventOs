"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Folder,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Layers,
  Trash2,
  X,
  Link as LinkIcon,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Grid,
  List,
  Archive,
  Star,
  Copy,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Clock,
  Pin,
  Tag,
  Info,
  HardDrive
} from "lucide-react";
import MediaDashboard from "@/components/gallery/MediaDashboard";
import { cn } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useOnboardingStore } from "@/store/onboardingStore";
import { GallerySkeleton } from "@/components/ui/skeletons";
import { useToastStore } from "@/lib/toastStore";

interface Album {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  itemCount: number;
  thumbnailUrl?: string;
  coverImage?: string;
  createdAt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "PRIVATE";
}

interface Event {
  id: string;
  name: string;
}

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { completeStep } = useOnboardingStore();

  // Dialog Toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState("");

  // Form State
  const [albumName, setAlbumName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [albumStatus, setAlbumStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [albumVisibility, setAlbumVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [coverImage, setCoverImage] = useState("");
  const [formError, setFormError] = useState("");

  // Pinned Albums state (Persisted locally)
  const [pinnedAlbumIds, setPinnedAlbumIds] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinned_albums");
      if (saved) {
        try {
          setPinnedAlbumIds(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  const togglePin = (albumId: string) => {
    const next = pinnedAlbumIds.includes(albumId)
      ? pinnedAlbumIds.filter((id) => id !== albumId)
      : [...pinnedAlbumIds, albumId];
    setPinnedAlbumIds(next);
    localStorage.setItem("pinned_albums", JSON.stringify(next));
    addToast(pinnedAlbumIds.includes(albumId) ? "Album unpinned" : "Album pinned to top", "success");
  };

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED">("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [sortOption, setSortOption] = useState("RECENT");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST" | "TIMELINE">("GRID");

  const [localAlbums, setLocalAlbums] = useState<Album[]>([]);

  // 1. Fetch Albums
  const { data: albumsResponse, isLoading: albumsLoading } = useQuery<{ data: Album[] }>({
    queryKey: ["albums"],
    queryFn: async () => {
      const response = await api.get("/gallery/albums");
      return response.data;
    }
  });

  // 2. Fetch Events
  const { data: eventsResponse } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  const albums = useMemo(() => albumsResponse?.data || [], [albumsResponse]);
  const events = useMemo(() => eventsResponse?.data || [], [eventsResponse]);

  useEffect(() => {
    if (albums.length > 0) {
      setLocalAlbums(albums);
    }
  }, [albums]);

  const getEventName = (eventId?: string) => {
    if (!eventId) return null;
    return events.find((e) => e.id === eventId)?.name || "Associated Event";
  };

  // Filtering & Sorting
  const filteredAndSortedAlbums = useMemo(() => {
    let result = localAlbums.filter((a) => {
      const nameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (a.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchVisibility = visibilityFilter === "ALL" || a.visibility === visibilityFilter;

      return (nameMatch || descMatch) && matchStatus && matchVisibility;
    });

    // Pinned albums are forced to the top
    result.sort((a, b) => {
      const aPinned = pinnedAlbumIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedAlbumIds.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      if (sortOption === "NAME") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "PHOTOS_COUNT") {
        return b.itemCount - a.itemCount;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [localAlbums, searchQuery, statusFilter, visibilityFilter, sortOption, pinnedAlbumIds]);

  const timelineGroupedAlbums = useMemo(() => {
    const groups: Record<string, Album[]> = {};
    filteredAndSortedAlbums.forEach((a) => {
      const date = new Date(a.createdAt);
      const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(a);
    });
    return Object.entries(groups);
  }, [filteredAndSortedAlbums]);

  // Mutations
  const createAlbumMutation = useMutation({
    mutationFn: async (newAlbum: Partial<Album>) => {
      const response = await api.post("/gallery/albums", newAlbum);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setShowCreateModal(false);
      resetForm();
      addToast("Album created successfully", "success");
      completeStep("upload_gallery");
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || "Failed to create album.");
    }
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Album> }) => {
      const response = await api.put(`/gallery/albums/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setRenamingAlbumId(null);
      addToast("Album details saved", "success");
    }
  });

  const archiveAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await api.put(`/gallery/albums/${albumId}/archive`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      addToast("Album moved to archive", "success");
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await api.delete(`/gallery/albums/${albumId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      addToast("Album and linked files permanently deleted", "success");
    }
  });

  const duplicateAlbumMutation = useMutation({
    mutationFn: async (album: Album) => {
      const response = await api.post("/gallery/albums", {
        name: `${album.name} (Copy)`,
        description: album.description,
        eventId: album.eventId,
        coverImage: album.coverImage,
        status: album.status,
        visibility: album.visibility
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      addToast("Album duplicated successfully", "success");
    }
  });

  const resetForm = () => {
    setAlbumName(""); setDescription(""); setSelectedEventId(""); setAlbumStatus("PUBLISHED"); setAlbumVisibility("PRIVATE"); setCoverImage(""); setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!albumName.trim()) {
      setFormError("Album name is required.");
      return;
    }
    createAlbumMutation.mutate({
      name: albumName, description: description || undefined, eventId: selectedEventId || undefined,
      status: albumStatus, visibility: albumVisibility, coverImage: coverImage || undefined
    });
  };

  const handleRenameSubmit = (album: Album) => {
    if (!renamedName.trim()) return;
    updateAlbumMutation.mutate({
      id: album.id,
      payload: {
        ...album,
        name: renamedName
      }
    });
  };

  const totalAlbums = albums.length;
  const totalPhotos = Math.round(albums.reduce((sum, album) => sum + album.itemCount, 0) * 0.75);
  const totalVideos = Math.round(albums.reduce((sum, album) => sum + album.itemCount, 0) * 0.25);

  const headerActions = (
    <button
      onClick={() => { resetForm(); setShowCreateModal(true); }}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15 cursor-pointer active:scale-[0.98]"
    >
      <Plus size={14} /> Create Album
    </button>
  );

  return (
    <PageShell
      title="Studio Media & Galleries"
      subtitle="Manage event albums, soft delete logs, Cloudinary optimizes, and client share links."
      actions={headerActions}
    >
      {/* Storage Bento KPIs Dashboard */}
      <MediaDashboard albums={albums} totalPhotos={totalPhotos} totalVideos={totalVideos} />

      {/* Filters Desk */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-zinc-850 pb-4 select-none">
        <div className="flex flex-wrap items-center gap-3 w-full lg:max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-550" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#121214]/60 border border-zinc-805 focus:border-purple-650 rounded-xl text-xs text-white focus:outline-none transition-colors"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="RECENT">Recently Uploaded</option>
            <option value="NAME">Album Name</option>
            <option value="PHOTOS_COUNT">Photos Volume</option>
          </select>

          <div className="flex bg-zinc-900 border border-zinc-850 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setViewMode("GRID")}
              className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold cursor-pointer", viewMode === "GRID" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
            >
              <Grid size={13} /> Grid
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold cursor-pointer", viewMode === "LIST" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setViewMode("TIMELINE")}
              className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold cursor-pointer", viewMode === "TIMELINE" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
            >
              <Clock size={13} /> Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Albums Content */}
      {albumsLoading ? (
        <GallerySkeleton />
      ) : (
        <div>
          {viewMode === "GRID" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  eventName={getEventName(album.eventId)}
                  isPinned={pinnedAlbumIds.includes(album.id)}
                  onPin={togglePin}
                  onDelete={(id) => setAlbumToDelete(id)}
                  onArchive={(id) => archiveAlbumMutation.mutate(id)}
                  onDuplicate={(a) => duplicateAlbumMutation.mutate(a)}
                  onRename={(id) => {
                    setRenamingAlbumId(id);
                    setRenamedName(album.name);
                  }}
                  onUpdateVisibility={(id, vis) => updateAlbumMutation.mutate({ id, payload: { ...album, visibility: vis } })}
                />
              ))}
            </div>
          )}

          {viewMode === "LIST" && (
            <div className="overflow-x-auto border border-zinc-850 bg-[#121214]/20 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-950/20 text-zinc-550 font-black uppercase text-[8.5px] tracking-wider">
                    <th className="p-4">Album Name</th>
                    <th className="p-4">Linked Event</th>
                    <th className="p-4">Asset Volume</th>
                    <th className="p-4">Visibility</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40 text-zinc-350">
                  {filteredAndSortedAlbums.map((album) => {
                    const eventName = getEventName(album.eventId);
                    return (
                      <tr key={album.id} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="p-4 font-bold text-zinc-200">
                          <span onClick={() => router.push(`/gallery/${album.id}`)} className="hover:underline cursor-pointer flex items-center gap-1.5">
                            {pinnedAlbumIds.includes(album.id) && <Pin size={11} className="text-purple-400 rotate-45 shrink-0" />}
                            {album.name}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-purple-400">{eventName || "N/A"}</td>
                        <td className="p-4 font-mono">{album.itemCount} items</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1">
                            {album.visibility === "PUBLIC" ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-zinc-500" />}
                            {album.visibility}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase",
                            album.status === "PUBLISHED" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-450" : "border-zinc-800 text-zinc-500"
                          )}>
                            {album.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{new Date(album.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right flex justify-end gap-3 items-center">
                          <button onClick={() => togglePin(album.id)} className="text-zinc-550 hover:text-purple-400" title="Pin to top">
                            <Pin size={13} className={pinnedAlbumIds.includes(album.id) ? "fill-purple-500 text-purple-400" : ""} />
                          </button>
                          <button onClick={() => duplicateAlbumMutation.mutate(album)} className="text-zinc-500 hover:text-zinc-300" title="Duplicate">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => archiveAlbumMutation.mutate(album.id)} className="text-zinc-500 hover:text-zinc-350" title="Archive">
                            <Archive size={13} />
                          </button>
                          <button onClick={() => setAlbumToDelete(album.id)} className="text-zinc-555 hover:text-red-500" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "TIMELINE" && (
            <div className="space-y-8 pl-4 border-l border-zinc-850 relative">
              {timelineGroupedAlbums.map(([monthYear, items]) => (
                <div key={monthYear} className="space-y-4 relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-600 border border-zinc-950" />
                  <h3 className="text-sm font-extrabold text-purple-400 font-mono uppercase tracking-wider">{monthYear}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        eventName={getEventName(album.eventId)}
                        isPinned={pinnedAlbumIds.includes(album.id)}
                        onPin={togglePin}
                        onDelete={(id) => setAlbumToDelete(id)}
                        onArchive={(id) => archiveAlbumMutation.mutate(id)}
                        onDuplicate={(a) => duplicateAlbumMutation.mutate(a)}
                        onRename={(id) => {
                          setRenamingAlbumId(id);
                          setRenamedName(album.name);
                        }}
                        onUpdateVisibility={(id, vis) => updateAlbumMutation.mutate({ id, payload: { ...album, visibility: vis } })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAndSortedAlbums.length === 0 && (
            <EmptyState
              icon={Folder}
              title="No media albums yet"
              description="Create your first album to start uploading event photos, videos, and visual media to share with clients."
              primaryAction={{ label: "Create Album", onClick: () => setShowCreateModal(true) }}
            />
          )}
        </div>
      )}

      {/* MODAL: CREATE ALBUM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 z-10 relative">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="text-purple-500" size={16} /> Create Media Album
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-black">Album Name</label>
                <input type="text" required value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="Kapoor Wedding - Setup Capture" className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-black">Description</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about this album..." className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-black">Visibility</label>
                  <select value={albumVisibility} onChange={(e) => setAlbumVisibility(e.target.value as any)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                    <option value="PRIVATE">Private (Restricted)</option>
                    <option value="PUBLIC">Public (Shared link)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-black">Status</label>
                  <select value={albumStatus} onChange={(e) => setAlbumStatus(e.target.value as any)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold">
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-black flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-500" /> Link Event Workspace (Optional)
                </label>
                <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                  <option value="">-- Standalone Album --</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300 font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={createAlbumMutation.isPending} className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md cursor-pointer">
                  {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {albumToDelete && (
        <ConfirmDialog
          isOpen={!!albumToDelete}
          title="Delete Album?"
          description="This action cannot be undone and will purge all photos and videos from Cloudinary CDN."
          onConfirm={() => {
            if (albumToDelete) deleteAlbumMutation.mutate(albumToDelete);
            setAlbumToDelete(null);
          }}
          onClose={() => setAlbumToDelete(null)}
        />
      )}

      {/* MODAL: INLINE RENAME */}
      {renamingAlbumId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 relative space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Rename Album Name</h3>
            <input type="text" value={renamedName} onChange={(e) => setRenamedName(e.target.value)} className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl text-white text-xs focus:outline-none" />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setRenamingAlbumId(null)} className="px-3 py-1.5 border border-zinc-805 bg-zinc-900 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={() => {
                const target = albums.find(a => a.id === renamingAlbumId);
                if (target) handleRenameSubmit(target);
              }} className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// Card Subcomponent
interface CardProps {
  album: Album;
  eventName: string | null;
  isPinned: boolean;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (album: Album) => void;
  onRename: (id: string) => void;
  onUpdateVisibility: (id: string, vis: "PUBLIC" | "PRIVATE") => void;
}

function AlbumCard({
  album, eventName, isPinned, onPin, onDelete, onArchive, onDuplicate, onRename, onUpdateVisibility
}: CardProps) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  const storageSize = useMemo(() => {
    return (album.itemCount * 3.8).toFixed(1);
  }, [album.itemCount]);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group rounded-2xl border border-zinc-800 bg-[#141416]/45 hover:border-purple-500/25 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[290px] shadow-md hover:shadow-lg relative"
      onClick={() => router.push(`/gallery/${album.id}`)}
    >
      {/* Cover Image */}
      <div className="h-36 relative w-full bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0 border-b border-zinc-850">
        {album.thumbnailUrl || album.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.thumbnailUrl || album.coverImage} alt={album.name} className="object-cover h-full w-full group-hover:scale-102 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center text-zinc-650 gap-1.5">
            <Folder size={32} className="text-zinc-700 group-hover:text-purple-500/30 transition-colors" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-555">Studio Album</span>
          </div>
        )}

        {/* Pin icon overlay */}
        {isPinned && (
          <span className="absolute top-3 right-3 bg-purple-600 text-white p-1 rounded-lg border border-purple-500/30 shadow-md">
            <Pin size={10} className="rotate-45" />
          </span>
        )}

        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md border border-zinc-850/80 px-2 py-0.5 rounded-md text-[9px] font-mono text-zinc-300 font-bold flex items-center gap-1">
          <Layers size={9} className="text-purple-400" /> {album.itemCount} items ({storageSize} MB)
        </span>

        <span className="absolute top-3 left-3 bg-black/50 backdrop-blur px-2 py-0.5 rounded-md text-[9px] font-bold text-zinc-400 flex items-center gap-1 border border-zinc-850/60">
          {album.visibility === "PUBLIC" ? <Eye size={10} className="text-emerald-400" /> : <EyeOff size={10} className="text-zinc-550" />}
          {album.visibility}
        </span>
      </div>

      {/* Body Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2 relative">
            <h3 className="font-bold text-xs text-zinc-200 group-hover:text-purple-400 transition-colors leading-snug line-clamp-1">
              {album.name}
            </h3>
            
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowOptions(!showOptions)} className="text-zinc-500 hover:text-white font-extrabold text-xs px-1 hover:bg-zinc-850 rounded cursor-pointer">&bull;&bull;&bull;</button>
              {showOptions && (
                <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-35 space-y-0.5 text-[10px]">
                  <button onClick={() => { onRename(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-300 cursor-pointer">
                    <Edit2 size={10} /> Rename
                  </button>
                  <button onClick={() => { onPin(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-350 cursor-pointer">
                    <Pin size={10} /> {isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => { onDuplicate(album); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-300 cursor-pointer">
                    <Copy size={10} /> Duplicate
                  </button>
                  <button onClick={() => { onArchive(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-350 cursor-pointer">
                    <Archive size={10} /> {album.status === "ARCHIVED" ? "Publish" : "Archive"}
                  </button>
                  <button onClick={() => { onUpdateVisibility(album.id, album.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-355 cursor-pointer">
                    {album.visibility === "PUBLIC" ? <EyeOff size={10} /> : <Eye size={10} />} Toggle Shared
                  </button>
                  <button onClick={() => { onDelete(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg flex items-center gap-1 text-red-500 cursor-pointer">
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-450 leading-relaxed line-clamp-2">{album.description || "No description set."}</p>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-850/60 pt-2 flex items-center justify-between text-[9px] text-zinc-550 select-none">
          {eventName ? (
            <span className="text-purple-400/90 font-bold flex items-center gap-0.5 truncate max-w-[130px]" title={eventName}>
              <LinkIcon size={9} /> {eventName}
            </span>
          ) : (
            <span>Standalone</span>
          )}
          <span className="font-mono">{new Date(album.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
