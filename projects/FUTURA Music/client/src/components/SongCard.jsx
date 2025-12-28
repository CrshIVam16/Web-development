// SongCard.jsx - Reusable UI card for a single song.
// Supports two visual variants: `horizontal` (default) and `compact` (list views).
// The component is purely presentational: actions are passed as props.

const Icon = {
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  ),
  Download: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...p}
    >
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M5 21h14" />
    </svg>
  ),
  Heart: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill={p.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...p}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Plus: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...p}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

export default function SongCard({
  song,
  onPlay,
  onDownload,
  onFavorite,
  onAdd,
  isFavorite,
  canAdd,
  variant = "horizontal", // horizontal or compact
}) {
  // COMPACT (used in RecentlyPlayed)
  if (variant === "compact") {
    return (
      <div className="group flex items-center justify-between gap-3 p-2 rounded-md hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 flex-shrink-0">
            <img
              src={song.coverPath || "https://placehold.co/40x40/111/EEE?text=%E2%99%AA"}
              alt=""
              className="w-full h-full rounded object-cover shadow-lg"
            />

            {/* On mobile there's no hover -> keep controls visible. On sm+ keep hover-reveal. */}
            <button
              type="button"
              onClick={onPlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              title="Play"
            >
              <Icon.Play className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{song.title}</p>
            <p className="text-xs text-white/60 truncate">{song.artist}</p>
          </div>
        </div>

        {/* Visible on mobile; hover-reveal on sm+ */}
        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onFavorite}
            className={`transition-colors ${isFavorite ? "text-purple-500" : "text-white/40 hover:text-white"
              }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon.Heart className="w-4 h-4" filled={isFavorite} />
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT (main song list card)
  return (
    <div className="group glass-card hover:bg-white/5 p-2 sm:p-2.5 transition-all duration-300">
      {/* Mobile: stack info + actions. Desktop: single row. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left: artwork + text */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12 sm:w-12 sm:h-12 flex-shrink-0">
            <img
              src={song.coverPath || "https://placehold.co/56x56/111/EEE?text=%E2%99%AA"}
              alt=""
              className="w-full h-full rounded-lg object-cover shadow-xl border border-white/10"
            />

            {/* Mobile: visible. Desktop: hover-reveal. */}
            <button
              type="button"
              onClick={onPlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40
                         opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg"
              title="Play"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                <Icon.Play className="w-4 h-4 text-white ml-0.5" />
              </div>
            </button>
          </div>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base text-white font-semibold truncate group-hover:text-purple-400 transition-colors">
              {song.title}
            </h3>
            <p className="text-white/60 text-xs sm:text-sm truncate">
              {song.artist} • {song.external ? "External" : "Local"}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onFavorite}
              className={`p-2 rounded-full transition-all ${isFavorite
                  ? "text-purple-500 bg-purple-500/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Icon.Heart className="w-5 h-5" filled={isFavorite} />
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all"
              title="Download"
            >
              <Icon.Download className="w-5 h-5" />
            </button>

            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                disabled={!canAdd}
                className={`p-2 rounded-full transition-all ${canAdd
                    ? "text-white/40 hover:text-white hover:bg-white/5"
                    : "opacity-20 cursor-not-allowed"
                  }`}
                title={canAdd ? "Add to playlist" : "Select a playlist first"}
              >
                <Icon.Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* On mobile, show Play button too (not md-only). Desktop keeps same vibe. */}
          <button
            type="button"
            onClick={onPlay}
            className="neon-btn !px-4 !py-1.5 text-sm"
            title="Play"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
}