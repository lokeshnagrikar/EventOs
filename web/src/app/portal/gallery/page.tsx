"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Camera, 
  ChevronLeft, 
  Folder, 
  Layers, 
  Loader2,
  Heart,
  SlidersHorizontal,
  Search,
  Download,
  X,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import MasonryGallery from "@/components/gallery/MasonryGallery";
import EXIFLightbox from "@/components/gallery/EXIFLightbox";

interface Album {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  itemCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  visibility?: string;
  status?: string;
}

interface GalleryItem {
  id: string;
  albumId: string;
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

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export default function PortalGalleryPage() {
  const queryClient = useQueryClient();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [favoriteFilter, setFavoriteFilter] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Album Access Passcode Lock
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  // Photo commenting
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<Record<string, Comment[]>>({});

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

  const rawAlbumItems = albumItemsResponse?.data || [];

  const items = useMemo(() => {
    return rawAlbumItems.map((item) => ({
      ...item,
      albumId: selectedAlbum?.id || ""
    }));
  }, [rawAlbumItems, selectedAlbum]);

  const activeComments = useMemo(() => {
    if (!activePhotoId) return [];
    return commentsList[activePhotoId] || [
      { id: "1", author: "Sneha Rao", text: "Decorator selection for floral layout.", createdAt: "Just now" }
    ];
  }, [activePhotoId, commentsList]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, favorite }: { itemId: string; favorite: boolean }) => {
      const response = await api.patch(`/gallery/items/${itemId}/favorite?favorite=${favorite}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientAlbumItems", selectedAlbum?.id] });
    }
  });

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setCategoryFilter("ALL");
    setTagFilter("");
    setFavoriteFilter(false);
    setIsUnlocked(false);
    setPasscode("");
    setUnlockError("");
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    // Simple passcode check (e.g. 1234 or mock unlock success)
    if (passcode === "1234" || passcode.trim().length > 0) {
      setIsUnlocked(true);
    } else {
      setUnlockError("Invalid passcode lock. Please try again.");
    }
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePhotoId) return;

    const newComment = {
      id: Math.random().toString(),
      author: "Client Operator",
      text: commentInput,
      createdAt: "Just now"
    };

    setCommentsList(prev => ({
      ...prev,
      [activePhotoId]: [...activeComments, newComment]
    }));
    setCommentInput("");
  };

  const downloadAlbumZip = async (albumId: string, albumName: string) => {
    if (downloading) return;
    try {
      setDownloading(true);
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
    } catch (error) {
      console.error("ZIP download failed", error);
    } finally {
      setDownloading(false);
    }
  };

  if (loadingEvents || (loadingAlbums && eventIds.length > 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Accessing Galleries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in text-zinc-300 select-none">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button
              onClick={handleBackToAlbums}
              className="h-8 w-8 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h3 className="text-base font-extrabold text-zinc-150 uppercase tracking-wider flex items-center gap-2">
              <Camera size={18} className="text-purple-500" />
              {selectedAlbum ? selectedAlbum.name : "Event Visual Galleries"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-bold">
              {selectedAlbum
                ? selectedAlbum.description || "Review captures, decorator mood boards, and site captures."
                : "View curated decorator design layouts and event capture assets."}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR FOR ACTIVE UNLOCKED ALBUM */}
      {selectedAlbum && isUnlocked && (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 bg-[#111113]/65 border border-zinc-850 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            
            {/* Category select */}
            <div className="relative w-full sm:w-48">
              <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-300 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Decor">Decor</option>
                <option value="Catering">Catering</option>
                <option value="Moodboard">Moodboard</option>
                <option value="Venue">Venue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Tag search input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Search tags..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-zinc-300 placeholder-zinc-550 focus:outline-none"
              />
              {tagFilter && (
                <button onClick={() => setTagFilter("")} className="absolute right-3 top-2.5 text-zinc-450 hover:text-zinc-200">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Favorite toggle button */}
            <button
              onClick={() => setFavoriteFilter(!favoriteFilter)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold w-full sm:w-auto transition-all",
                favoriteFilter ? "bg-red-500/10 border-red-950/40 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-450 hover:text-zinc-200"
              )}
            >
              <Heart size={14} fill={favoriteFilter ? "currentColor" : "none"} className={favoriteFilter ? "text-red-500" : ""} />
              Favorites Only
            </button>

          </div>

          <button
            onClick={() => downloadAlbumZip(selectedAlbum.id, selectedAlbum.name)}
            disabled={downloading || items.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 w-full sm:w-auto shadow-md"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Download ZIP
          </button>
        </div>
      )}

      {/* MAIN SWITCH LOGIC RENDER */}
      {!selectedAlbum ? (
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
                className="group rounded-2xl border border-zinc-800 bg-[#111113]/40 hover:border-purple-650/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px]"
              >
                {/* Thumbnail cover */}
                <div className="h-36 relative w-full bg-zinc-900 flex items-center justify-center shrink-0 border-b border-zinc-850">
                  {album.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.thumbnailUrl}
                      alt={album.name}
                      className="object-cover h-full w-full group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                      <Folder size={32} className="text-zinc-700" />
                      <span className="text-[9px] uppercase tracking-wider font-bold">Studio Album</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur border border-zinc-800/80 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 font-mono">
                    <Layers size={10} className="text-purple-400" />
                    {album.itemCount} items
                  </span>
                </div>

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
        /* PASSCODE UNLOCK SCREEN */
        !isUnlocked ? (
          <div className="max-w-md mx-auto p-6 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-4 relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/10 via-transparent to-transparent pointer-events-none" />
            <div className="h-10 w-10 mx-auto rounded-full bg-purple-550/10 flex items-center justify-center text-purple-400 border border-purple-900/20">
              <Lock size={18} />
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Secure Album Passcode</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Please enter the secure credentials provided by your coordinator.</p>
            </div>

            {unlockError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10.5px] rounded-lg">
                {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlockSubmit} className="space-y-3.5 text-xs text-left">
              <input
                type="password"
                required
                placeholder="Enter 4-digit passcode lock (e.g. 1234)..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-center font-mono focus:outline-none"
              />
              <button type="submit" className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md">
                Unlock Visual Assets
              </button>
            </form>
          </div>
        ) : (
          /* PINTEREST MASONRY LIBRARY VIEW */
          <div className="flex gap-6 items-start">
            <div className="flex-1">
              {loadingAlbumItems ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="aspect-square bg-zinc-900 border border-zinc-850 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <MasonryGallery
                  items={items}
                  albums={[]}
                  onSelectItem={(idx) => {
                    setLightboxIndex(idx);
                    setActivePhotoId(items[idx]?.id);
                  }}
                  onToggleFavorite={(itemId, favorite) => toggleFavoriteMutation.mutate({ itemId, favorite })}
                  onDeleteItems={() => {}}
                  onMoveItems={() => {}}
                  onCopyItems={() => {}}
                  onBatchTagItems={() => {}}
                  readOnly={true}
                />
              )}
            </div>

            {/* Photo Comment drawer */}
            {activePhotoId && (
              <div className="w-72 shrink-0 border border-zinc-850 bg-[#111113]/30 p-4.5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                  <span className="text-[9px] text-zinc-550 uppercase font-black tracking-widest flex items-center gap-1">
                    <MessageSquare size={12} /> Asset Comments
                  </span>
                  <button onClick={() => setActivePhotoId(null)} className="text-zinc-500 hover:text-white">
                    &times;
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 text-[11px] leading-relaxed">
                  {activeComments.map((c) => (
                    <div key={c.id} className="p-2.5 bg-zinc-950/20 border border-zinc-850/60 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-zinc-300">{c.author}</span>
                        <span className="text-zinc-550 text-[9px]">{c.createdAt}</span>
                      </div>
                      <p className="text-zinc-400">"{c.text}"</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCommentSubmit} className="flex gap-1.5 border-t border-zinc-850 pt-3">
                  <input
                    type="text"
                    required
                    placeholder="Add comment..."
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
          </div>
        )
      )}

      {/* FULLSCREEN LIGHTBOX PLAYBACK */}
      {lightboxIndex !== null && items[lightboxIndex] && (
        <EXIFLightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((prev) => (prev === null || prev === items.length - 1 ? 0 : prev + 1))}
          onPrev={() => setLightboxIndex((prev) => (prev === null || prev === 0 ? items.length - 1 : prev - 1))}
          onToggleFavorite={(itemId, favorite) => toggleFavoriteMutation.mutate({ itemId, favorite })}
          onDeleteItem={() => {}}
          readOnly={true}
        />
      )}

    </div>
  );
}
