import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Player context: Manages audio playback, queue, and progress
const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [queue, setQueue] = useState([]);        // list of songs [{_id,title,artist,url,coverUrl}]
  const [index, setIndex] = useState(0);         // current song index
  const [playing, setPlaying] = useState(false); // is audio playing?
  const [progress, setProgress] = useState(0);   // currentTime (seconds)
  const [duration, setDuration] = useState(0);   // duration (seconds)
  const [volume, setVolume] = useState(0.9);     // 0..1

  const current = queue[index] || null;

  // Setup audio element event listeners
  useEffect(() => {
    const a = audioRef.current;
    a.volume = volume;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setProgress(a.currentTime || 0);
    const onEnded = () => {
        // Do not auto-play next track anymore; just stop playing
        setPlaying(false);
    };

    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
    };
  }, [index, queue, volume]);

  const playAt = (i) => {
    const a = audioRef.current;
    const song = queue[i];
    if (!song || !song.url) return;
    a.src = song.url;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setIndex(i);
  };

  // Set queue and start playing from specified index
  const setQueueAndPlay = (songs, startIndex = 0) => {
    setQueue(songs);
    setTimeout(() => playAt(startIndex), 0);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const next = () => { if (index < queue.length - 1) playAt(index + 1); };
  const prev = () => {
    const a = audioRef.current;
    if (index > 0) playAt(index - 1);
    else a.currentTime = 0;
  };

  const seek = (sec) => {
    const a = audioRef.current;
    a.currentTime = sec;
    setProgress(sec);
  };

  const setVol = (v) => {
    const val = Math.max(0, Math.min(1, v));
    audioRef.current.volume = val;
    setVolume(val);
  };

  const value = useMemo(() => ({
    queue, index, current, playing, progress, duration, volume,
    setQueueAndPlay, playAt, toggle, next, prev, seek, setVol
  }), [queue, index, current, playing, progress, duration, volume]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  return useContext(PlayerContext);
}