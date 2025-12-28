// Navbar.jsx - Top navigation bar
// - Shows different items depending on authentication state
// - Handles mobile dropdown behaviour and logout
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    setOpen(false);
  }, [user]);

  const desktopLink = ({ isActive }) =>
    isActive
      ? "text-white font-bold"
      : "text-white/60 hover:text-white transition-all font-semibold";

  const mobileLink = ({ isActive }) =>
    [
      "block w-full px-3 py-2 rounded-lg transition",
      isActive ? "bg-white/10 text-white font-bold" : "text-white/80 hover:bg-white/5 hover:text-white",
    ].join(" ");

  return (
    <nav className="glass-nav sticky top-0 z-[60] border-b border-white/5 bg-black/80 backdrop-blur-2xl">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight text-gradient hover:opacity-80 transition whitespace-nowrap"
            onClick={() => setOpen(false)}
          >
            🎵 FUTURA Music
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <div className="flex items-center gap-8">
                  <NavLink to="/" end className={desktopLink}>
                    Home
                  </NavLink>
                  <NavLink to="/upload" className={desktopLink}>
                    Upload
                  </NavLink>
                  <NavLink to="/playlists" className={desktopLink}>
                    Playlists
                  </NavLink>
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">Welcome, {user.name}!</p>
                    <p className="text-white/60 text-xs">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="neon-outline-btn px-4 py-2 text-sm font-medium">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" end className={({ isActive }) => (isActive ? "neon-btn px-4 py-2" : "neon-outline-btn px-4 py-2")}>
                  Login
                </NavLink>
                <NavLink to="/signup" end className={({ isActive }) => (isActive ? "neon-btn px-4 py-2" : "neon-outline-btn px-4 py-2")}>
                  Sign Up
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden neon-outline-btn px-3 py-2"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden mt-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden">
            <div className="p-3">
              {user ? (
                <>
                  <div className="grid gap-1">
                    <NavLink to="/" end className={mobileLink} onClick={() => setOpen(false)}>
                      Home
                    </NavLink>
                    <NavLink to="/upload" className={mobileLink} onClick={() => setOpen(false)}>
                      Upload
                    </NavLink>
                    <NavLink to="/playlists" className={mobileLink} onClick={() => setOpen(false)}>
                      Playlists
                    </NavLink>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/10">
                    <p className="text-white font-semibold text-sm">Welcome, {user.name}!</p>
                    <p className="text-white/60 text-xs break-all">{user.email}</p>

                    <button onClick={handleLogout} className="mt-3 w-full neon-outline-btn py-2 text-sm font-medium">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NavLink to="/login" end onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "neon-btn py-2" : "neon-outline-btn py-2")}>
                    Login
                  </NavLink>
                  <NavLink to="/signup" end onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "neon-btn py-2" : "neon-outline-btn py-2")}>
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}