// App.jsx - Main application layout and routing
// Responsibilities:
// - Provide top-level layout (Navbar, main content area)
// - Maintain lightweight player queue and playback state
// - Coordinate between pages/components for play actions
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Player from "./components/Player.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Welcome from "./components/Welcome.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Playlists from "./pages/Playlists.jsx";
import Signup from "./pages/Signup.jsx";
import Upload from "./pages/Upload.jsx";
import { useAuth } from "./state/AuthContext.jsx";

export default function App() {
  // Global player state: list of songs and current playing index
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showWelcome, setShowWelcome] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;

  const { token, user } = useAuth();
  const location = useLocation();

  // Check if user is on login/signup page (we hide player there)
  const onAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Keep your existing behaviour
  const hideScrollbarPages = ["/login", "/signup", "/upload"];
  const hideScrollbar = hideScrollbarPages.includes(location.pathname);

  const showPlayer = !!token && !onAuthPage;

  // Show welcome screen on first login (only once per session)
  useEffect(() => {
    if (token && user && lastLoginTime !== token) {
      setShowWelcome(true);
      setLastLoginTime(token);
    }
  }, [token, user, lastLoginTime]);

  // Load favorites from localStorage when token changes
  // Uses user-specific key: favorites_<userId>
  useEffect(() => {
    if (token && user) {
      const userId = user._id || user.id || user.email;
      const storageKey = `favorites_${userId}`;
      const storedFavorites = localStorage.getItem(storageKey);
      if (storedFavorites) {
        try {
          setFavorites(new Set(JSON.parse(storedFavorites)));
        } catch (e) { }
      }
    } else {
      setFavorites(new Set());
    }
  }, [token, user]);

  const toggleFavorite = (songId) => {
    if (!songId || !user) return;
    // Toggle locally with localStorage using user-specific key
    const userId = user._id || user.id || user.email;
    const storageKey = `favorites_${userId}`;
    const newFavorites = new Set(favorites);
    if (newFavorites.has(songId)) newFavorites.delete(songId);
    else newFavorites.add(songId);
    setFavorites(newFavorites);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newFavorites)));
  };

  // Clear queue when logged out or on auth pages
  useEffect(() => {
    if (!showPlayer) {
      setQueue([]);
      setCurrentIndex(-1);
    }
  }, [showPlayer]);

  const playSong = (songs, index, auto = false) => {
    setQueue(songs);
    setCurrentIndex(index);
    setShouldAutoPlay(Boolean(auto));
  };
  const playerVisible = showPlayer && !!currentSong;

  const playNext = () => {
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const playPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  /**
   * Layout rules:
   * - Auth/upload pages should be full width; the page itself handles centering.
   * - Normal pages: reserve enough space for the fixed player (mobile needs more).
   * - Include safe-area inset for iOS devices.
   */
  const containerClass = hideScrollbar
    ? "w-full flex-1 min-w-0 overflow-x-hidden"
    : `w-full max-w-[1920px] mx-auto flex-1 min-w-0 overflow-x-hidden ${playerVisible
      ? "pb-[calc(10.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(7rem+env(safe-area-inset-bottom))]"
      : "pb-0"
    }`;

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden">
      {showWelcome && <Welcome user={user} onDismiss={() => setShowWelcome(false)} />}

      <Navbar />

      <div className={`${containerClass}`}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home
                    onPlay={(songs, index, auto) => playSong(songs, index, auto)}
                    favorites={favorites}
                    onFavoriteToggle={toggleFavorite}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <Playlists onPlay={(songs, index, auto) => playSong(songs, index, auto)} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
      </div>

      {playerVisible && (
        <Player
          song={currentSong}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex >= 0 && currentIndex < queue.length - 1}
          onPrev={playPrev}
          onNext={playNext}
          shouldAutoPlay={shouldAutoPlay}
          setShouldAutoPlay={setShouldAutoPlay}
          isFavorite={currentSong ? favorites.has(currentSong._id) : false}
          onFavoriteToggle={() => currentSong && toggleFavorite(currentSong._id)}
        />
      )}
    </div>
  );
}