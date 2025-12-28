// DiscoverSection.jsx - Search and quick local-file playback UI
// Responsibilities:
// - Provide search input for external/local songs
// - Allow picking a local file to play instantly (uses an Object URL)
// - Provide a quick playlist selector for adding songs
import { useRef } from "react";

export default function DiscoverSection({
  q,
  setQ,
  onSearch,
  onPlayLocal,
  playlists,
  targetPlId,
  setTargetPlId,
  onRefreshPlaylists,
}) {

  const fileRef = useRef(null);

  const openFilePicker = () => {
    fileRef.current?.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top row: Search + Local file */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search Box */}
        <div className="glass-card p-4 border-purple-500/20 bg-purple-500/5">
          <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 block">
            Search Music
          </label>

          {/* Mobile: stacked | sm+: inline */}
          <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Songs, artists, or external sources..."
              className="neon-input w-full sm:flex-1 !bg-black/40"
            />
            <button type="submit" className="neon-btn w-full sm:w-auto !px-6">
              Search
            </button>
          </form>
        </div>

        {/* Local File Box */}
        <div className="glass-card p-4 border-blue-500/20 bg-blue-500/5">
          <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">
            Play Local File
          </label>

          {/* Hidden real file input */}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={onPlayLocal}
            className="hidden"
          />

          {/* Same structure as Search: input-like area + button */}
          <div className="flex items-center gap-2">
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openFilePicker() : null)}
              className="neon-input flex-1 !bg-black/40 flex items-center min-w-0 cursor-pointer"
              title="Choose a file"
            >
              <span className="text-white/50 text-sm truncate">
                Choose a file to play instantly...
              </span>
            </div>

            <button
              type="button"
              onClick={openFilePicker}
              className="shrink-0 px-4 sm:px-6 py-2 rounded-md font-medium text-white transition-all duration-200
             bg-gradient-to-r from-blue-600 to-cyan-500
             shadow-[0_0_18px_rgba(59,130,246,0.35)]
             hover:shadow-[0_0_28px_rgba(59,130,246,0.55)]
             hover:scale-[1.02] active:scale-95"
            >
              Browse
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Selector */}
      <div className="glass-card p-4 border-white/10">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
          Quick Add to Playlist
        </label>

        {/* Mobile: stacked | sm+: inline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
          <div className="select-wrapper w-full min-w-0">
            <select
              className="select-dark w-full !bg-black/40"
              value={targetPlId}
              onChange={(e) => setTargetPlId(e.target.value)}
            >
              <option value="" disabled>
                Select a destination playlist...
              </option>
              {playlists.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.name}
                </option>
              ))}
            </select>

            <svg className="chevron w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center"
            onClick={onRefreshPlaylists}
            title="Refresh Playlists"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}