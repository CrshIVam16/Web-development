// Home.jsx - Main discovery page.
// Responsibilities:
// - Search local and external songs (calls `api` utils)
// - Manage `recentlyPlayed` (localStorage) and simple playlist interactions
// - Delegate playback control to parent (`onPlay` prop)
import { useEffect, useMemo, useState } from "react";
import DiscoverSection from "../components/DiscoverSection.jsx";
import RecentlyPlayed from "../components/RecentlyPlayed.jsx";
import SongCard from "../components/SongCard.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../utils/api.js";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default function Home({ onPlay, favorites, onFavoriteToggle }) {
  const { token, user } = useAuth();

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [targetPlId, setTargetPlId] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [favoriteFilter, setFavoriteFilter] = useState("all");

  // Mobile drawer state
  const [recentOpen, setRecentOpen] = useState(false);

  const recentlyPlayedKey = useMemo(() => {
    const id = user?._id || user?.id || user?.email;
    return id ? `recentlyPlayed:${id}` : null;
  }, [user]);

  const loadRecentlyPlayed = () => {
    if (!recentlyPlayedKey) return [];
    const raw = localStorage.getItem(recentlyPlayedKey);
    if (!raw) return [];
    const parsed = safeJsonParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  };

  const saveRecentlyPlayed = (list) => {
    if (!recentlyPlayedKey) return;
    localStorage.setItem(recentlyPlayedKey, JSON.stringify(list));
  };

  const clearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
    if (recentlyPlayedKey) localStorage.removeItem(recentlyPlayedKey);
    localStorage.removeItem("recentlyPlayed"); // legacy cleanup
  };

  useEffect(() => {
    if (!token) {
      setRecentlyPlayed([]);
      return;
    }

    fetchSongs();
    loadPlaylists();

    localStorage.removeItem("recentlyPlayed"); // legacy cleanup

    if (recentlyPlayedKey) setRecentlyPlayed(loadRecentlyPlayed());
    else setRecentlyPlayed([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, recentlyPlayedKey]);

  const loadPlaylists = async () => {
    try {
      const data = await api.get("/api/playlists");
      setPlaylists(data);
    } catch (e) { }
  };

  const fetchSongs = async (query = "") => {
    if (!token) return;
    setLoading(true);
    try {
      const [locals, externals] = await Promise.all([
        api.get(`/api/songs${query ? `?q=${encodeURIComponent(query)}` : ""}`),
        api.get(`/api/external-songs${query ? `?q=${encodeURIComponent(query)}` : ""}`),
      ]);
      setSongs([...locals, ...externals].slice(0, 10));
    } catch (e) {
      if (!e.message?.includes("No token")) alert("Failed to load songs: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSongs(q);
  };

  const handlePlayClick = (songList, index) => {
    const song = songList[index];

    setRecentlyPlayed((prev) => {
      const next = [song, ...prev.filter((s) => s._id !== song._id)].slice(0, 20);
      saveRecentlyPlayed(next);
      return next;
    });

    onPlay(songList, index, true);
  };

  const handleDownload = async (song) => {
    try {
      const path = song.external
        ? `/api/external-songs/${encodeURIComponent(song._id)}/download`
        : `/api/songs/${song._id}/download`;
      await api.download(path, `${song.title}.mp3`);
    } catch (e) {
      alert("Download failed: " + e.message);
    }
  };

  const handleAddToPlaylist = async (song) => {
    if (!targetPlId) return alert("Select a playlist first");
    try {
      await api.post(`/api/playlists/${targetPlId}/add`, { song });
      alert("Added to playlist");
    } catch (e) {
      alert("Add failed: " + e.message);
    }
  };

  const handlePlayLocal = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const song = {
      _id: `local:${Date.now()}`,
      title: f.name.replace(/\.[^/.]+$/, ""),
      artist: "Local File",
      filePath: url,
      coverPath: "",
      external: false,
    };
    onPlay([song], 0, true);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full bg-black text-white overflow-x-hidden">
      {/* Main */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <header className="mb-6 md:mb-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                Discover Music
              </h1>
              <p className="text-white/40 text-sm">Explore local tracks and external hits</p>
            </div>

            {/* Mobile: open recently played drawer (prevents long scrolling) */}
            <button
              type="button"
              onClick={() => setRecentOpen(true)}
              className="lg:hidden neon-outline-btn px-3 py-2 text-sm whitespace-nowrap"
              title="Open Recently Played"
            >
              Recently Played
            </button>
          </div>
        </header>

        <DiscoverSection
          q={q}
          setQ={setQ}
          onSearch={handleSearch}
          onPlayLocal={handlePlayLocal}
          playlists={playlists}
          targetPlId={targetPlId}
          setTargetPlId={setTargetPlId}
          onRefreshPlaylists={loadPlaylists}
        />

        <section className="mt-8 md:mt-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              {q ? `Search Results for "${q}"` : "All Available Songs"}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {songs.length === 0 ? (
                <p className="text-white/30 italic text-center py-10">
                  No songs found. Try a different search.
                </p>
              ) : (
                songs.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    onPlay={() => handlePlayClick(songs, idx)}
                    onDownload={() => handleDownload(song)}
                    onFavorite={() => onFavoriteToggle(song._id)}
                    onAdd={() => handleAddToPlaylist(song)}
                    isFavorite={favorites.has(song._id)}
                    canAdd={!!targetPlId}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Desktop sidebar ONLY (keeps the desktop look exactly) */}
      <aside className="hidden lg:block lg:w-[420px] xl:w-[480px] p-4 border-l border-white/5 bg-black/40 backdrop-blur-md lg:overflow-y-auto">
        <RecentlyPlayed
          recentlyPlayed={recentlyPlayed}
          onPlay={handlePlayClick}
          onFavorite={onFavoriteToggle}
          favorites={favorites}
          onClear={clearRecentlyPlayed}
          favoriteFilter={favoriteFilter}
          setFavoriteFilter={setFavoriteFilter}
          onPlayAll={() => recentlyPlayed.length > 0 && handlePlayClick(recentlyPlayed, 0)}
        />
      </aside>

      {/* Mobile drawer (prevents Recently Played being pushed to bottom) */}
      {recentOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setRecentOpen(false)}
            aria-label="Close Recently Played"
          />
          <div className="absolute right-0 top-0 h-full w-[min(92vw,420px)] bg-black/80 backdrop-blur-xl border-l border-white/10 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-semibold">Recently Played</div>
              <button onClick={() => setRecentOpen(false)} className="neon-outline-btn px-3 py-2">
                ✕
              </button>
            </div>

            <RecentlyPlayed
              recentlyPlayed={recentlyPlayed}
              onPlay={(list, idx) => {
                setRecentOpen(false);
                handlePlayClick(list, idx);
              }}
              onFavorite={onFavoriteToggle}
              favorites={favorites}
              onClear={clearRecentlyPlayed}
              favoriteFilter={favoriteFilter}
              setFavoriteFilter={setFavoriteFilter}
              onPlayAll={() => {
                if (recentlyPlayed.length > 0) {
                  setRecentOpen(false);
                  handlePlayClick(recentlyPlayed, 0);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}