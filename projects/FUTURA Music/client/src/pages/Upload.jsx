// Upload page: Upload MP3 files to server
import { useState } from "react";
import { api } from "../utils/api.js";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select an MP3 file");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("file", file);

    setUploading(true);
    try {
      await api.post("/api/songs/upload", formData);
      alert("Uploaded!");
      setTitle("");
      setArtist("");
      setFile(null);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      <div className="glass-card p-5 sm:p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">Upload MP3</h1>
        <p className="text-white/50 text-sm mt-2">
          Add your own tracks. Provide a title and artist, then choose an MP3 file.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <input
            className="neon-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="neon-input"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">
              MP3 file
            </label>
            <input
              type="file"
              accept=".mp3,audio/mpeg,audio/mp3"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="neon-input file:mr-4 file:rounded-md file:border-0 file:bg-fuchsia-500/80 file:text-white file:px-3 file:py-1 hover:file:bg-fuchsia-500/100"
            />
            <p className="text-xs text-white/40 mt-2 break-words">
              {file ? `Selected: ${file.name}` : "No file selected yet."}
            </p>
          </div>

          <button disabled={uploading} className="neon-btn w-full">
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}