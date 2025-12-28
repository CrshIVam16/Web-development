// routes/externalSongs.js - Integrates with third-party music preview APIs
// Behavior:
// - `/` fetches a list of preview tracks from Deezer (preferred) with an iTunes fallback
// - `/:externalId/download` proxies the preview stream so clients can download via the server
const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");

const router = express.Router();

// Helper: build a composite id like `deezer:12345` or `itunes:98765`
function idProv(provider, id) {
  return provider + ":" + id;
}

// Helper: parse composite external id back into provider + id
function parseId(externalId) {
  const parts = (externalId || "").split(":");
  return { provider: parts[0], id: parts[1] };
}

// GET /api/external-songs?q= - Search external providers for preview tracks
router.get("/", auth, async (req, res) => {
  const q = (req.query.q || "lofi").trim();

  // Try Deezer first (returns short preview URLs)
  try {
    const dz = await axios.get("https://api.deezer.com/search", {
      params: { q },
      timeout: 10000,
    });
    const list = dz.data?.data || [];
    const normalized = list
      .map((t) => ({
        _id: idProv("deezer", t.id),
        title: t.title || "Unknown",
        artist: t.artist?.name || "Unknown",
        filePath: t.preview || "",
        coverPath: t.album?.cover_medium || t.album?.cover_big || "",
        external: true,
      }))
      .filter((s) => !!s.filePath);

    if (normalized.length > 0) return res.json(normalized);
  } catch (e) {
    // If Deezer fails, fallback to iTunes below
  }

  // iTunes fallback (also provides previewUrl)
  try {
    const it = await axios.get("https://itunes.apple.com/search", {
      params: { media: "music", term: q, limit: 20 },
      timeout: 10000,
    });
    const list = it.data?.results || [];
    const normalized = list
      .filter((r) => r.previewUrl)
      .map((r) => ({
        _id: idProv("itunes", r.trackId),
        title: r.trackName || "Unknown",
        artist: r.artistName || "Unknown",
        filePath: r.previewUrl,
        coverPath: r.artworkUrl100 || "",
        external: true,
      }));
    return res.json(normalized);
  } catch (e) {
    return res.status(500).json({ message: "External music API unavailable" });
  }
});

// GET /api/external-songs/:externalId/download - Proxy an external preview stream
router.get("/:externalId/download", auth, async (req, res) => {
  const decoded = decodeURIComponent(req.params.externalId || "");
  const { provider, id } = parseId(decoded);

  try {
    if (provider === "deezer") {
      const info = await axios.get("https://api.deezer.com/track/" + id, { timeout: 10000 });
      const track = info.data;
      if (!track || !track.preview) return res.status(404).json({ message: "Track not found or no preview" });
      const upstream = await axios.get(track.preview, { responseType: "stream" });
      const safeName = (track.title || ("track_" + id)).replace(/[^\w.\-]+/g, "_");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.mp3"`);
      upstream.data.pipe(res);
      return;
    }

    if (provider === "itunes") {
      const info = await axios.get("https://itunes.apple.com/lookup", {
        params: { id, entity: "song" },
        timeout: 10000,
      });
      const result = info.data && info.data.results && info.data.results[0];
      if (!result || !result.previewUrl) return res.status(404).json({ message: "Track not found or no preview" });
      const upstream = await axios.get(result.previewUrl, { responseType: "stream" });
      const safeName = (result.trackName || ("track_" + id)).replace(/[^\w.\-]+/g, "_");
      res.setHeader("Content-Type", "audio/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.m4a"`);
      upstream.data.pipe(res);
      return;
    }

    return res.status(400).json({ message: "Unsupported provider" });
  } catch (e) {
    res.status(500).json({ message: "Download failed" });
  }
});

module.exports = router;