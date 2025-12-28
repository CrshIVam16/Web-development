// Player component: wraps an HTMLAudioElement to play a single `song` object
// Expected `song` shape: { _id, title, artist, filePath, coverPath, external }
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api.js";

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const Icon = {
  Prev: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M20 19L7 12l13-7v14z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
      />
    </svg>
  ),
  Next: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M17 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4 19l13-7L4 5v14z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
      />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
    </svg>
  ),
  Pause: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 5h5v14H6zM13 5h5v14h-5z" fill="currentColor" />
    </svg>
  ),
  Volume: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 10v4h4l5 4V6l-5 4H4z" fill="currentColor" />
      <path
        d="M16 8c1.5 1 1.5 7 0 8M18.5 6c2.5 2 2.5 10 0 12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function Player({
  song,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  shouldAutoPlay,
  setShouldAutoPlay,
  isFavorite,
  onFavoriteToggle,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const v = parseFloat(localStorage.getItem("vol") || "0.8");
    return isNaN(v) ? 0.8 : v;
  });

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !song) return;
    // Apply saved volume and load the new source
    a.volume = volume;
    a.load();

    // Only auto-play when explicitly requested (shouldAutoPlay true)
    if (shouldAutoPlay) {
      // Play returns a promise in modern browsers; handle rejection silently (autoplay policy)
      a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      try { setShouldAutoPlay(false); } catch (e) { }
    } else {
      // ensure UI reflects paused state when switching songs without autoplay
      setIsPlaying(false);
    }
  }, [song]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // Update UI state from audio element events
    const onTime = () => setCurrent(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    // Auto-play next song when current ends; stop if no next song available
    const onEnded = () => {
      setIsPlaying(false);
      if (hasNext) {
        onNext();
      }
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [onNext, hasNext]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    localStorage.setItem("vol", String(volume));
  }, [volume]);

  const pct = useMemo(() => {
    return duration ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;
  }, [current, duration]);

  const onSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const next = Math.max(0, Math.min(duration, duration * ratio));
    // Jump to the calculated time and update UI immediately for snappy feedback
    audioRef.current.currentTime = next;
    setCurrent(next);
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      try {
        await a.play();
        setIsPlaying(true);
      } catch { }
    }
  };

  const handleDownload = async () => {
    if (!song) return;
    try {
      if (song.external)
        await api.download(
          `/api/external-songs/${encodeURIComponent(song._id)}/download`,
          `${song.title}.mp3`
        );
      else await api.download(`/api/songs/${song._id}/download`, `${song.title}.mp3`);
    } catch (e) {
      alert("Download failed: " + e.message);
    }
  };

  if (!song) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-t border-white/10">
      <div className="mx-auto max-w-[1920px] px-3 sm:px-4 py-2 sm:py-3">
        {/* Mobile: 2-row layout | Desktop: 3-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_2fr_1.2fr] items-center gap-2 sm:gap-4">
          {/* TOP/LEFT (mobile row 1) */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={song.coverPath || "https://placehold.co/48x48/111/EEE?text=%E2%99%AA"}
                alt=""
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-md border border-white/10 object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">{song.title}</div>
                <div className="text-xs text-white/70 truncate">{song.artist}</div>
              </div>
            </div>

            {/* Mobile actions (so we don't create a 3rd row just for the heart) */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={onFavoriteToggle}
                className={`p-2 transition-colors ${isFavorite ? "text-purple-500" : "text-white/40 hover:text-white"
                  }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-6 h-6"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>

          {/* CENTER (mobile row 2) */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-4 sm:gap-5 mb-2">
              <button
                className="p-2 rounded-md text-white/80 hover:text-white transition disabled:opacity-40"
                onClick={onPrev}
                disabled={!hasPrev}
                title="Previous"
              >
                <Icon.Prev className="w-6 h-6" />
              </button>

              <button
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Icon.Pause className="w-6 h-6" /> : <Icon.Play className="w-6 h-6" />}
              </button>

              <button
                className="p-2 rounded-md text-white/80 hover:text-white transition disabled:opacity-40"
                onClick={onNext}
                disabled={!hasNext}
                title="Next"
              >
                <Icon.Next className="w-6 h-6" />
              </button>
            </div>

            {/* PROGRESS */}
            <div className="w-full flex items-center gap-3 select-none">
              <span className="hidden sm:block text-xs tabular-nums text-white/70 w-12 text-right">
                {formatTime(current)}
              </span>

              <div
                className="relative w-full h-2 rounded-full bg-white/15 cursor-pointer overflow-visible"
                onClick={onSeek}
              >
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-1/2 left-0 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(244,114,182,0.6)] pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pct}%` }}
                />
              </div>

              <span className="hidden sm:block text-xs tabular-nums text-white/70 w-12">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* RIGHT (desktop only) */}
          <div className="hidden sm:flex items-center justify-end gap-3">
            <button
              onClick={onFavoriteToggle}
              className={`p-2 transition-colors ${isFavorite ? "text-purple-500" : "text-white/40 hover:text-white"
                }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-6 h-6"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Volume: keep hidden until md to save space */}
            <div className="hidden md:flex items-center gap-2 w-32">
              <Icon.Volume className="w-5 h-5 text-white/80" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={song.filePath} preload="metadata" />
    </div>
  );
}