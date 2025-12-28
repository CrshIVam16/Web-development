// Playlists page: Create and manage playlists, add/remove songs
import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

export default function Playlists({ onPlay }) {
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/playlists");
      setPlaylists(data);
    } catch (e) {
      alert("Failed to load playlists: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await api.post("/api/playlists", { name });
      setNewName("");
      load();
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  };

  const removeSong = async (plId, songId) => {
    try {
      await api.post(`/api/playlists/${plId}/remove`, { songId });
      load();
    } catch (e) {
      alert("Remove failed: " + e.message);
    }
  };

  const playPlaylist = (pl) => {
    if (!pl.songs?.length) return;
    onPlay(pl.songs, 0, true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">My Playlists</h1>
        <p className="text-white/50 text-sm mt-1">
          Create playlists and manage your saved tracks.
        </p>
      </div>

      {/* Create playlist row (mobile stacked) */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="neon-input w-full sm:flex-1"
            placeholder="New playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="neon-btn w-full sm:w-auto" onClick={create}>
            Create
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-white/80">Loading...</p>
      ) : !playlists.length ? (
        <div className="glass-card p-6 text-white/80">
          No playlists yet. Create one above, then add songs from the Home page.
        </div>
      ) : (
        // Mobile: 1 column | Desktop: 2 columns
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {playlists.map((pl) => (
            <div key={pl._id} className="glass-card p-4 card-hover min-w-0">
              {/* Playlist header (wrap on mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{pl.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {pl.songs?.length || 0} song{(pl.songs?.length || 0) === 1 ? "" : "s"}
                  </div>
                </div>

                <button
                  className="neon-outline-btn disabled:opacity-40 w-full sm:w-auto"
                  onClick={() => playPlaylist(pl)}
                  disabled={!pl.songs?.length}
                >
                  Play All
                </button>
              </div>

              {!pl.songs?.length ? (
                <div className="text-sm text-white/70">No songs in this playlist yet.</div>
              ) : (
                <div className="grid gap-2">
                  {pl.songs.map((s, idx) => (
                    <div
                      key={s._id}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 min-w-0"
                    >
                      {/* Mobile: stack | sm+: row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              s.coverPath ||
                              "https://placehold.co/48x48/111/EEE?text=%E2%99%AA"
                            }
                            alt=""
                            className="w-10 h-10 rounded-md object-cover border border-white/10 shrink-0"
                          />

                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.title}</div>
                            <div className="text-xs text-white/70 truncate">
                              {s.artist} {s.external ? "(external)" : "(local)"}
                            </div>
                          </div>
                        </div>

                        {/* Buttons: wrap and full width on mobile */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                          <button
                            className="neon-btn w-full sm:w-auto"
                            onClick={() => onPlay && onPlay(pl.songs, idx, true)}
                          >
                            Play
                          </button>
                          <button
                            className="neon-outline-btn w-full sm:w-auto"
                            onClick={() => removeSong(pl._id, s._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}