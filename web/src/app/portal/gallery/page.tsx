"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Camera, ChevronLeft, Folder, Layers, Play, X, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  name: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  format?: string;
  size?: number;
  createdAt: string;
}

interface EventItem {
  id: string;
}

export default function PortalGalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 1. Fetch Events to retrieve client eventIds
  const { data: eventsResponse, isLoading: loadingEvents } = useQuery<{ data: EventItem[] }>({
    queryKey: ["clientEvents"],
    queryFn: async () => {
      const res = await api.get("/events/client");
      return res.data;
    }
  });

  const events = eventsResponse?.data || [];
  const eventIds = events.map(e => e.id);

  // 2. Fetch Client Albums
  const { data: albumsResponse, isLoading: loadingAlbums } = useQuery<{ data: Album[] }>({
    queryKey: ["clientAlbums", eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return { data: [] };
      const res = await api.get(`/gallery/albums/client?eventIds=${eventIds.join(",")}`);
      return res.data;
    },
    enabled: eventIds.length > 0
  });

  const clientAlbums = albumsResponse?.data || [];

  // 3. Fetch Album Items if selected
  const { data: albumItemsResponse, isLoading: loadingAlbumItems } = useQuery<{ data: GalleryItem[] }>({
    queryKey: ["clientAlbumItems", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return { data: [] };
      const res = await api.get(`/gallery/items/album/${selectedAlbum.id}`);
      return res.data;
    },
    enabled: !!selectedAlbum
  });

  const activeAlbumItems = albumItemsResponse?.data || [];

  if (loadingEvents || (loadingAlbums && eventIds.length > 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Accessing galleries...</span>
      </div>
    );
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Navigation and description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
              <Camera size={18} className="text-purple-500" />
              {selectedAlbum ? selectedAlbum.name : "Event Visual Galleries"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {selectedAlbum
                ? selectedAlbum.description || "Review captures, decorator mood boards, and site captures."
                : "View curated decorator design layouts and event capture assets."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Switch */}
      {!selectedAlbum ? (
        /* Albums List View */
        clientAlbums.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl bg-[#161618]/10 text-zinc-500 flex flex-col items-center justify-center gap-3">
            <Camera size={36} className="text-zinc-700" />
            <div>
              <p className="font-semibold text-zinc-450">No albums established</p>
              <p className="text-xs text-zinc-650 mt-1">Captures and mood board photos will show here once uploaded.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="group rounded-2xl border border-zinc-850 bg-[#111113]/40 hover:border-purple-650/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px] hover:shadow-lg hover:shadow-purple-500/5"
              >
                {/* Thumbnail */}
                <div className="h-36 relative w-full bg-zinc-900 flex items-center justify-center shrink-0">
                  {album.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.thumbnailUrl}
                      alt={album.name}
                      className="object-cover h-full w-full group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                      <Folder size={32} className="text-zinc-750" />
                      <span className="text-[9px] uppercase tracking-wider font-bold">Empty</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur border border-zinc-800/80 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 font-mono">
                    <Layers size={10} className="text-purple-400" />
                    {album.itemCount} items
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors truncate">
                      {album.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {album.description || "No descriptions set."}
                    </p>
                  </div>
                  <div className="border-t border-zinc-850/40 pt-2 flex justify-between text-[10px] text-zinc-550 font-mono">
                    <span>Event Gallery</span>
                    <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Album Items View (Masonry columns) */
        loadingAlbumItems ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="aspect-square bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeAlbumItems.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-850 rounded-2xl bg-[#111113]/10 text-zinc-500 text-xs">
            No media assets uploaded in this album yet.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {activeAlbumItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative break-inside-avoid mb-4 rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-650/40 hover:shadow-lg transition-all duration-300"
              >
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
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
                      <div className="h-9 w-9 rounded-full bg-black/60 border border-zinc-800 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 opacity-0 group-hover:opacity-100 transition-all p-3 flex flex-col justify-end">
                  <p className="text-[10px] text-zinc-200 truncate w-full font-semibold">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* FULLSCREEN LIGHTBOX */}
      <AnimatePresence>
        {lightboxIndex !== null && activeAlbumItems[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 md:p-6 select-none"
          >
            {/* Header */}
            <div className="flex justify-between items-center z-50">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                  {activeAlbumItems[lightboxIndex].name}
                </h2>
                {activeAlbumItems[lightboxIndex].size && (
                  <p className="text-[9px] text-zinc-550 font-mono mt-0.5">
                    Size: {formatBytes(activeAlbumItems[lightboxIndex].size)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-350 hover:text-white transition-all shadow"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex items-center justify-center relative my-4">
              {activeAlbumItems.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    let idx = lightboxIndex - 1;
                    if (idx < 0) idx = activeAlbumItems.length - 1;
                    setLightboxIndex(idx);
                  }}
                  className="absolute left-0 md:left-4 z-50 h-11 w-11 rounded-full bg-zinc-900/60 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="max-w-[85vw] max-h-[70vh] flex items-center justify-center">
                {activeAlbumItems[lightboxIndex].type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeAlbumItems[lightboxIndex].url}
                    alt={activeAlbumItems[lightboxIndex].name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-zinc-950"
                  />
                ) : (
                  <div className="w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden border border-zinc-950 shadow-2xl bg-black">
                    <video
                      src={activeAlbumItems[lightboxIndex].url}
                      controls
                      autoPlay
                      className="w-full max-h-[70vh] object-contain"
                    />
                  </div>
                )}
              </div>

              {activeAlbumItems.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    let idx = lightboxIndex + 1;
                    if (idx >= activeAlbumItems.length) idx = 0;
                    setLightboxIndex(idx);
                  }}
                  className="absolute right-0 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/60 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-lg"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-center z-50">
              <span className="bg-zinc-900/60 border border-zinc-800/60 px-3.5 py-1 rounded-full text-zinc-400 text-[10px] font-mono">
                Asset {lightboxIndex + 1} of {activeAlbumItems.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
