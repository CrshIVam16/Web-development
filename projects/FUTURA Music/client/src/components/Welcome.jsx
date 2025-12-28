// Welcome screen: displayed on first login to greet the user
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome({ user, onDismiss }) {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();

  const handleStart = () => {
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in">
        <div className="text-5xl mb-4">🎵</div>
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || "Music Lover"}!</h1>
        <p className="text-white/70 mb-6">
          You're all set to explore amazing music. Search, upload, create playlists, and enjoy your favorite tracks!
        </p>
        <button
          onClick={handleStart}
          className="neon-btn w-full"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
