// RecentlyPlayed.jsx - Sidebar/list showing recently played songs.
// Persists only in browser localStorage (not server-synced) to keep scope simple
import SongCard from "./SongCard";

export default function RecentlyPlayed({
  recentlyPlayed,
  onPlay,
  onFavorite,
  favorites,
  onClear,
  favoriteFilter,
  setFavoriteFilter,
  onPlayAll,
}) {
  const filteredSongs = () => {
    if (favoriteFilter === "favorite") {
      return recentlyPlayed.filter((s) => favorites.has(s._id));
    } else if (favoriteFilter === "non-favorite") {
      return recentlyPlayed.filter((s) => !favorites.has(s._id));
    }
    return recentlyPlayed;
  };

  return (
    <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden lg:h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 min-w-0">
            <span className="text-2xl">🕐</span>
            <span className="whitespace-nowrap">Recently Played</span>
          </h2>

          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            <button
              onClick={onPlayAll}
              className="px-3 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-all"
              title="Play all in sequence"
            >
              Play All
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1 rounded-md bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          {["all", "favorite", "non-favorite"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFavoriteFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${favoriteFilter === filter
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
            >
              {filter === "all" ? "All" : filter === "favorite" ? "Favorites" : "Others"}
            </button>
          ))}
        </div>
      </div>

      {/* List
          Mobile needs its own max height because the parent is not height-constrained.
          Desktop sidebar can take full height (lg:h-full) and scroll naturally.
      */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[55vh] sm:max-h-[60vh] lg:max-h-none">
        {filteredSongs().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-white/30 italic">
            <p className="text-sm">No songs found</p>
          </div>
        ) : (
          filteredSongs().map((song) => (
            <SongCard
              key={song._id}
              song={song}
              onPlay={() => onPlay([song], 0, true)}
              onFavorite={() => onFavorite(song._id)}
              isFavorite={favorites.has(song._id)}
              variant="compact"
            />
          ))
        )}
      </div>
    </div>
  );
}