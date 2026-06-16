"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  AlertCircle
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

interface Event {
  id: string;
  name: string;
}

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form State
  const [albumName, setAlbumName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [formError, setFormError] = useState("");

  // 1. Fetch Albums
  const { data: albumsResponse, isLoading: albumsLoading } = useQuery<{ data: Album[] }>({
    queryKey: ["albums"],
    queryFn: async () => {
      const response = await api.get("/gallery/albums");
      return response.data;
    }
  });

  // 2. Fetch Events (for workspace mapping)
  const { data: eventsResponse } = useQuery<{ data: Event[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data;
    }
  });

  const albums = albumsResponse?.data || [];
  const events = eventsResponse?.data || [];

  const getEventName = (eventId?: string) => {
    if (!eventId) return null;
    return events.find((e) => e.id === eventId)?.name || "Associated Event";
  };

  // 3. Mutation: Create Album
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

  // 4. Mutation: Delete Album
  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await api.delete(`/gallery/albums/${albumId}`);
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
      eventId: selectedEventId || undefined
    });
  };

  const handleDeleteAlbum = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent navigating to album page
    if (confirm("Are you sure you want to delete this album? This will delete all images and videos inside it from Cloudinary and the database.")) {
      deleteAlbumMutation.mutate(id);
    }
  };

  // Compute Stats
  const totalAlbums = albums.length;
  const totalItems = albums.reduce((sum, album) => sum + album.itemCount, 0);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800 bg-[#111113]/80 backdrop-blur px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Media Galleries</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Assets</span>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
        >
          <Plus size={16} />
          Create Album
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gallery & Visual Assets</h2>
            <p className="text-xs text-zinc-400 mt-1">Manage, catalog, and review client media, mood boards, and site capture libraries.</p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 bg-[#161618]/60 border border-zinc-800/80 px-5 py-3 rounded-xl">
            <div className="text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Albums</span>
              <p className="text-xl font-extrabold text-purple-400 font-mono mt-0.5">{totalAlbums}</p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cataloged Items</span>
              <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">{totalItems}</p>
            </div>
          </div>
        </div>

        {/* Albums List */}
        {albumsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[280px] rounded-xl border border-zinc-800 bg-[#161618]/20 animate-pulse flex flex-col justify-between p-5">
                <div className="space-y-3">
                  <div className="h-32 bg-zinc-900 rounded-lg w-full"></div>
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                  <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-zinc-900 rounded w-1/4 self-end"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => {
              const eventName = getEventName(album.eventId);

              return (
                <div
                  key={album.id}
                  onClick={() => (window.location.href = `/gallery/${album.id}`)}
                  className="group rounded-xl border border-zinc-800 bg-[#161618]/45 hover:border-purple-500/35 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[290px] shadow-md hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5"
                >
                  {/* Thumbnail / Cover section */}
                  <div className="h-36 relative w-full bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                    {album.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={album.thumbnailUrl}
                        alt={album.name}
                        className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                        <Folder size={36} className="text-zinc-700 group-hover:text-purple-500/40 transition-colors" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold">Empty Gallery</span>
                      </div>
                    )}

                    {/* Quick Badge */}
                    <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md border border-zinc-850/80 px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-300 font-bold flex items-center gap-1 shadow-sm">
                      <Layers size={10} className="text-purple-400" />
                      {album.itemCount} items
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors leading-snug line-clamp-1">
                          {album.name}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteAlbum(e, album.id)}
                          className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800/50 transition-colors shrink-0"
                          title="Delete Album"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal line-clamp-2 mt-1 font-normal">
                        {album.description || "No description provided."}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="border-t border-zinc-800/40 pt-3 mt-4 flex items-center justify-between text-[10px]">
                      {eventName ? (
                        <span className="text-purple-400/90 font-medium flex items-center gap-1 truncate max-w-[170px]" title={eventName}>
                          <LinkIcon size={10} />
                          {eventName}
                        </span>
                      ) : (
                        <span className="text-zinc-500">Unlinked Album</span>
                      )}
                      <span className="text-zinc-500 font-mono">
                        {new Date(album.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {albums.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-[#161618]/10 text-sm text-zinc-500 flex flex-col items-center justify-center gap-3">
                <Folder size={48} className="text-zinc-700" />
                <div>
                  <p className="font-semibold text-zinc-400">No media albums established</p>
                  <p className="text-xs text-zinc-500 mt-1">Establish your first album to begin uploading visual media.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-xs font-semibold rounded-lg text-zinc-300 transition-all"
                >
                  Create First Album
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE ALBUM DIALOG (MODAL) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Folder className="text-purple-500" size={16} />
                Create Media Album
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-450 uppercase font-bold tracking-wider">Album Name</label>
                <input
                  type="text"
                  required
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="E.g., Kapoor Wedding - Setup Capture"
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-450 uppercase font-bold tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details about this album's contents..."
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-600 transition-all leading-normal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-450 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} className="text-zinc-500" />
                  Link Event Workspace (Optional)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-600 font-medium"
                >
                  <option value="">-- No link (Standalone Album) --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                >
                  {createAlbumMutation.isPending ? "Creating..." : "Establish Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
