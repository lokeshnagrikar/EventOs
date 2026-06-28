"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Camera, 
  ChevronLeft, 
  Folder, 
  Layers, 
  Play, 
  X, 
  ChevronRight, 
  Loader2,
  Heart,
  Search,
  Download,
  Tag,
  SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/lib/toastStore";

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
  category?: string;
  favorite?: boolean;
  tags?: string[];
}

interface EventItem {
  id: string;
}

export default function PortalGalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [favoriteFilter, setFavoriteFilter] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const addToast = useToastStore((state) => state.addToast);

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

  // 3. Fetch Album Items if selected (with filters)
  const { data: albumItemsResponse, isLoading: loadingAlbumItems } = useQuery<{ data: GalleryItem[] }>({
    queryKey: ["clientAlbumItems", selectedAlbum?.id, categoryFilter, tagFilter, favoriteFilter],
    queryFn: async () => {
      if (!selectedAlbum) return { data: [] };
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== "ALL") {
        params.append("category", categoryFilter);
      }
      if (tagFilter.trim()) {
        params.append("tag", tagFilter.trim());
      }
      if (favoriteFilter) {
        params.append("favorite", "true");
      }
      const queryString = params.toString();
      const res = await api.get(`/gallery/items/album/${selectedAlbum.id}${queryString ? `?${queryString}` : ""}`);
      return res.data;
    },
    enabled: !!selectedAlbum
  });

  const activeAlbumItems = albumItemsResponse?.data || [];

  // Helper for ZIP download
  const downloadAlbumZip = async (albumId: string, albumName: string) => {
    if (downloading) return;
    try {
      setDownloading(true);
      addToast(`Preparing ZIP download for "${albumName}"...`, "info");
      
      const response = await api.get(`/gallery/albums/${albumId}/download`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${albumName}.zip`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast(`Successfully downloaded "${albumName}.zip"!`, "success");
    } catch (error) {
      console.error("ZIP download failed", error);
      addToast("Failed to download ZIP. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setCategoryFilter("ALL");
    setTagFilter("");
    setFavoriteFilter(false);
  };

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
              onClick={handleBackToAlbums}
              className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h3 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
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

      {/* Filter Bar and Download Button for active Album */}
      {selectedAlbum && (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 bg-[#111113]/60 backdrop-blur-md border border-zinc-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            {/* Category Select */}
            <div className="relative w-full sm:w-48">
              <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-purple-650 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Decor">Decor</option>
                <option value="Catering">Catering</option>
                <option value="Moodboard">Moodboard</option>
                <option value="Venue">Venue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Tag Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Search tags..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-purple-650 transition-all"
              />
              {tagFilter && (
                <button
                  onClick={() => setTagFilter("")}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Favorites Toggle */}
            <button
              onClick={() => setFavoriteFilter(!favoriteFilter)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold w-full sm:w-auto transition-all ${
                favoriteFilter
                  ? "bg-red-500/10 border-red-950/40 text-red-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Heart size={14} fill={favoriteFilter ? "currentColor" : "none"} className={favoriteFilter ? "text-red-500" : ""} />
              Favorites Only
            </button>
          </div>

          {/* ZIP Download Button */}
          <button
            onClick={() => downloadAlbumZip(selectedAlbum.id, selectedAlbum.name)}
            disabled={downloading || activeAlbumItems.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-750 disabled:bg-purple-800/40 disabled:text-zinc-500 text-white text-xs font-bold transition-all w-full lg:w-auto shadow-md shadow-purple-600/20 disabled:shadow-none"
          >
            {downloading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Downloading...
              </>
            ) : (
              <>
                <Download size={14} />
                Download All (ZIP)
              </>
            )}
          </button>
        </div>
      )}

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
                className="group rounded-2xl border border-zinc-800 bg-[#111113]/40 hover:border-purple-650/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px] hover:shadow-lg hover:shadow-purple-500/5"
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
            No media assets match the selected filters in this album.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {activeAlbumItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative break-inside-avoid mb-4 rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden cursor-pointer hover:border-purple-650/40 hover:shadow-lg transition-all duration-300"
              >
                {/* Heart Badge for Favorites */}
                {item.favorite && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur border border-zinc-800/80 p-1.5 rounded-full text-red-500 shadow z-10">
                    <Heart size={12} fill="currentColor" />
                  </div>
                )}

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
                
                {/* Hover details overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all p-3 flex flex-col justify-end gap-1.5">
                  <p className="text-xs text-zinc-100 truncate w-full font-semibold">{item.name}</p>
                  
                  {/* Category and Tags */}
                  {(item.category || (item.tags && item.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.category && (
                        <span className="bg-purple-600/80 backdrop-blur border border-purple-500/20 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                          {item.category}
                        </span>
                      )}
                      {item.tags?.map((tag) => (
                        <span key={tag} className="bg-zinc-800/80 backdrop-blur border border-zinc-700/50 text-zinc-300 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                          <Tag size={8} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                    {activeAlbumItems[lightboxIndex].name}
                  </h2>
                  {activeAlbumItems[lightboxIndex].favorite && (
                    <Heart size={12} className="text-red-500" fill="currentColor" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {activeAlbumItems[lightboxIndex].size && (
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {formatBytes(activeAlbumItems[lightboxIndex].size)}
                    </span>
                  )}
                  {activeAlbumItems[lightboxIndex].category && (
                    <span className="bg-purple-650/30 text-purple-400 text-[8px] font-semibold px-1.5 py-0.5 rounded border border-purple-900/30">
                      {activeAlbumItems[lightboxIndex].category}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow"
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
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-zinc-955"
                  />
                ) : (
                  <div className="w-full max-w-4xl max-h-[70vh] rounded-lg overflow-hidden border border-zinc-955 shadow-2xl bg-black">
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
                  className="absolute right-0 md:right-4 z-50 h-11 w-11 rounded-full bg-zinc-900/60 backdrop-blur hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-center text-zinc-350 hover:text-white transition-all shadow-lg"
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
