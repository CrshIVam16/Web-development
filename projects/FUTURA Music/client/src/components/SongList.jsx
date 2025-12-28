// SongList.jsx - Renders a list/grid of songs.
// Each item exposes handlers for play, download, favorite, and add-to-playlist actions.
// Keep this component presentational: all side-effects (API calls, navigation)
// should be handled by parent pages (e.g., `Home`, `Playlists`).
export default function SongList({ songs, onPlayClick, onDownloadClick, onAddClick, canAdd = false, onFavoriteClick, favorites = new Set() }) {
  if (!songs?.length) return <p className="text-white/60">No songs yet. Try uploading or searching.</p>;
  return (
    <div className="grid gap-3">
      {songs.map((s, idx) => (
        <div key={s._id} className="glass-card card-hover p-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={s.coverPath || "https://placehold.co/64x64/111/EEE?text=%E2%99%AA"}
                alt=""
                className="w-12 h-12 rounded-lg object-cover border border-white/20"
              />
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-white/70">{s.artist} {s.external ? "(external)" : "(local)"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onPlayClick(idx)} className="neon-btn">Play</button>
              <button onClick={() => onDownloadClick(s)} className="neon-outline-btn">Download</button>
              {onFavoriteClick && (
                <button
                  onClick={() => onFavoriteClick(s._id)}
                  className={`text-2xl transition ${
                    favorites.has(s._id)
                      ? "text-yellow-400 hover:text-yellow-300"
                      : "text-white/40 hover:text-yellow-400"
                  }`}
                  title={favorites.has(s._id) ? "Remove favorite" : "Add to favorites"}
                >
                  ⭐
                </button>
              )}
              {onAddClick && (
                <button
                  onClick={() => onAddClick(s)}
                  disabled={!canAdd}
                  className={`neon-outline-btn ${!canAdd ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={canAdd ? "Add to selected playlist" : "Select a playlist first"}
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}