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
  Clock
} from "lucide-react";
import MediaDashboard from "@/components/gallery/MediaDashboard";
import { cn } from "@/lib/utils";

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

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED">("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [sortOption, setSortOption] = useState("RECENT");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST" | "TIMELINE">("GRID");

  // Local state for reordering (pinterest style)
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

  // Sync localAlbums for drag reordering when API loads
  useEffect(() => {
    if (albums.length > 0) {
      setLocalAlbums(albums);
    }
  }, [albums]);

  const getEventName = (eventId?: string) => {
    if (!eventId) return null;
    return events.find((e) => e.id === eventId)?.name || "Associated Event";
  };

  // 3. Filtering & Sorting Albums
  const filteredAndSortedAlbums = useMemo(() => {
    let result = localAlbums.filter((a) => {
      const nameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (a.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchVisibility = visibilityFilter === "ALL" || a.visibility === visibilityFilter;

      return (nameMatch || descMatch) && matchStatus && matchVisibility;
    });

    if (sortOption === "NAME") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "PHOTOS_COUNT") {
      result.sort((a, b) => b.itemCount - a.itemCount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [localAlbums, searchQuery, statusFilter, visibilityFilter, sortOption]);

  // 4. Chronological timeline grouping
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
    }
  });

  const archiveAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await api.put(`/gallery/albums/${albumId}/archive`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await api.delete(`/gallery/albums/${albumId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
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
    }
  });

  const resetForm = () => {
    setAlbumName("");
    setDescription("");
    setSelectedEventId("");
    setAlbumStatus("PUBLISHED");
    setAlbumVisibility("PRIVATE");
    setCoverImage("");
    setFormError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!albumName.trim()) {
      setFormError("Album name is required.");
      return;
    }

    createAlbumMutation.mutate({
      name: albumName,
      description: description || undefined,
      eventId: selectedEventId || undefined,
      status: albumStatus,
      visibility: albumVisibility,
      coverImage: coverImage || undefined
    });
  };

  const handleRenameSubmit = (album: Album) => {
    if (!renamedName.trim()) return;
    updateAlbumMutation.mutate({
      id: album.id,
      payload: {
        name: renamedName,
        description: album.description,
        eventId: album.eventId,
        coverImage: album.coverImage,
        status: album.status,
        visibility: album.visibility
      }
    });
  };

  // Compute Stats
  const totalAlbums = albums.length;
  const totalPhotos = Math.round(albums.reduce((sum, album) => sum + album.itemCount, 0) * 0.75);
  const totalVideos = Math.round(albums.reduce((sum, album) => sum + album.itemCount, 0) * 0.25);

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden transition-all duration-200 select-none">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-700/50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Media Asset Hub</span>
            <span className="text-[10px] px-2 py-0.5 bg-purple-950/40 border border-purple-900/50 rounded text-purple-400 font-extrabold uppercase font-mono tracking-wider">
              Studio
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus size={14} />
          Create Album
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full z-10 relative overflow-y-auto">
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold tracking-tight">Studio Media & Galleries</h2>
          <p className="text-xs text-zinc-450 mt-1">Manage event albums, soft delete logs, Cloudinary optimizes, and client share links.</p>
        </div>

        {/* Storage KPIs Dashboard */}
        <MediaDashboard albums={albums} totalPhotos={totalPhotos} totalVideos={totalVideos} />

        {/* Search & Advanced Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-zinc-850 pb-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-550" />
              <input
                type="text"
                placeholder="Search albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-[#121214]/60 border border-zinc-800 focus:border-purple-650 rounded-xl text-xs text-white focus:outline-none transition-colors"
              />
            </div>
            
            {/* Status select */}
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

            {/* Visibility select */}
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

          {/* View Toggles & Sorting */}
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
                className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold", viewMode === "GRID" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
              >
                <Grid size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode("LIST")}
                className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold", viewMode === "LIST" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
              >
                <List size={13} /> List
              </button>
              <button
                onClick={() => setViewMode("TIMELINE")}
                className={cn("px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-bold", viewMode === "TIMELINE" ? "bg-zinc-800 text-purple-400" : "text-zinc-550")}
              >
                <Clock size={13} /> Timeline
              </button>
            </div>
          </div>
        </div>

        {/* ─── ALBUMS RENDER CONTROLLER ─── */}
        {albumsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[250px] rounded-2xl border border-zinc-850 bg-[#161618]/25 animate-pulse" />
            ))}
          </div>
        ) : (
          <div>
            {/* GRID VIEW */}
            {viewMode === "GRID" && (
              <Reorder.Group axis="y" values={localAlbums} onReorder={setLocalAlbums} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedAlbums.map((album) => (
                  <Reorder.Item key={album.id} value={album} className="cursor-grab active:cursor-grabbing">
                    <AlbumCard
                      album={album}
                      eventName={getEventName(album.eventId)}
                      onDelete={(id) => setAlbumToDelete(id)}
                      onArchive={(id) => archiveAlbumMutation.mutate(id)}
                      onDuplicate={(a) => duplicateAlbumMutation.mutate(a)}
                      onRename={(id) => {
                        setRenamingAlbumId(id);
                        setRenamedName(album.name);
                      }}
                      onUpdateVisibility={(id, vis) => updateAlbumMutation.mutate({ id, payload: { ...album, visibility: vis } })}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {/* LIST VIEW */}
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
                            <span onClick={() => router.push(`/gallery/${album.id}`)} className="hover:underline cursor-pointer">
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
                            <button onClick={() => duplicateAlbumMutation.mutate(album)} className="text-zinc-500 hover:text-zinc-300" title="Duplicate">
                              <Copy size={13} />
                            </button>
                            <button onClick={() => archiveAlbumMutation.mutate(album.id)} className="text-zinc-500 hover:text-zinc-350" title="Archive">
                              <Archive size={13} />
                            </button>
                            <button onClick={() => setAlbumToDelete(album.id)} className="text-zinc-550 hover:text-red-500" title="Delete">
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

            {/* TIMELINE CHRONOLOGICAL VIEW */}
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
              <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-[#161618]/10 text-sm text-zinc-500 flex flex-col items-center justify-center gap-3">
                <Folder size={48} className="text-zinc-700 animate-pulse" />
                <div>
                  <p className="font-semibold text-zinc-400">No media albums established</p>
                  <p className="text-xs text-zinc-500 mt-1">Setup your first album to begin uploading visual media.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL: CREATE ALBUM ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/15 via-transparent to-transparent pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 z-10 relative">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="text-purple-500" size={16} />
                Create Media Album
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
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
                <input
                  type="text"
                  required
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="e.g. Kapoor Wedding - Setup Capture"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-black">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this album..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-black">Visibility</label>
                  <select
                    value={albumVisibility}
                    onChange={(e) => setAlbumVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  >
                    <option value="PRIVATE">Private (Restricted)</option>
                    <option value="PUBLIC">Public (Shared link)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-black">Status</label>
                  <select
                    value={albumStatus}
                    onChange={(e) => setAlbumStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 uppercase font-black flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-500" />
                  Link Event Workspace (Optional)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                >
                  <option value="">-- Standalone Album --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending}
                  className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md"
                >
                  {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRM ─── */}
      {albumToDelete && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 relative">
            <h3 className="font-bold text-base text-red-400 mb-2">Delete Album?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">This action cannot be undone and will purge all photos and videos from Cloudinary CDN.</p>
            <div className="flex justify-end gap-3 text-xs">
              <button onClick={() => setAlbumToDelete(null)} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-zinc-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAlbumMutation.mutate(albumToDelete);
                  setAlbumToDelete(null);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INLINE RENAME ─── */}
      {renamingAlbumId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 relative space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Rename Album Name</h3>
            <input
              type="text"
              value={renamedName}
              onChange={(e) => setRenamedName(e.target.value)}
              className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl text-white text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setRenamingAlbumId(null)} className="px-3 py-1.5 border border-zinc-805 bg-zinc-900 rounded-lg">Cancel</button>
              <button
                onClick={() => {
                  const target = albums.find(a => a.id === renamingAlbumId);
                  if (target) handleRenameSubmit(target);
                }}
                className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Card Subcomponent
function AlbumCard({
  album,
  eventName,
  onDelete,
  onArchive,
  onDuplicate,
  onRename,
  onUpdateVisibility
}: {
  album: Album;
  eventName: string | null;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (album: Album) => void;
  onRename: (id: string) => void;
  onUpdateVisibility: (id: string, vis: "PUBLIC" | "PRIVATE") => void;
}) {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      onClick={() => router.push(`/gallery/${album.id}`)}
      className="group rounded-2xl border border-zinc-800 bg-[#141416]/45 hover:border-purple-500/25 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px] shadow-md hover:shadow-lg relative"
    >
      {/* Cover Image */}
      <div className="h-32 relative w-full bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0 border-b border-zinc-850">
        {album.thumbnailUrl || album.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.thumbnailUrl || album.coverImage}
            alt={album.name}
            className="object-cover h-full w-full group-hover:scale-102 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center text-zinc-650 gap-1.5">
            <Folder size={32} className="text-zinc-700 group-hover:text-purple-500/30 transition-colors" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-550">Studio Album</span>
          </div>
        )}

        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md border border-zinc-850/80 px-2 py-0.5 rounded-md text-[9px] font-mono text-zinc-300 font-bold flex items-center gap-1">
          <Layers size={9} className="text-purple-400" />
          {album.itemCount} items
        </span>

        {/* Visibility Icon overlay */}
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
            
            {/* Quick Actions popover */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-zinc-500 hover:text-white font-extrabold text-xs px-1 hover:bg-zinc-850 rounded"
              >
                &bull;&bull;&bull;
              </button>
              {showOptions && (
                <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-35 space-y-0.5 text-[10px]">
                  <button onClick={() => { onRename(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-300">
                    <Edit2 size={10} /> Rename
                  </button>
                  <button onClick={() => { onDuplicate(album); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-300">
                    <Copy size={10} /> Duplicate
                  </button>
                  <button onClick={() => { onArchive(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-350">
                    <Archive size={10} /> {album.status === "ARCHIVED" ? "Publish" : "Archive"}
                  </button>
                  <button onClick={() => { onUpdateVisibility(album.id, album.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg flex items-center gap-1 text-zinc-350">
                    {album.visibility === "PUBLIC" ? <EyeOff size={10} /> : <Eye size={10} />} Toggle Shared
                  </button>
                  <button onClick={() => { onDelete(album.id); setShowOptions(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg flex items-center gap-1 text-red-500">
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-450 leading-relaxed line-clamp-2">
            {album.description || "No description set."}
          </p>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-850/60 pt-2 flex items-center justify-between text-[9px] text-zinc-550">
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
    </div>
  );
}
