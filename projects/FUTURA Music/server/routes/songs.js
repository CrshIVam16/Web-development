// routes/songs.js - Manage local MP3 files (list, upload, download)
// Notes:
// - Uploaded files are saved to `uploads/` on disk; the DB keeps only metadata
// - Endpoints require authentication via the `auth` middleware
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Song = require("../models/Song");
const auth = require("../middleware/auth");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration: write files to disk with a timestamped, sanitized filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const sanitized = (file.originalname || "file.mp3").replace(/[^\w.\-]+/g, "_");
    cb(null, Date.now() + "_" + sanitized);
  },
});

// Simple MP3 validation by common MIME types or .mp3 extension
const allowedMimes = new Set(["audio/mpeg", "audio/mp3", "audio/mpeg3", "audio/mpg", "audio/x-mpeg"]);
function isMp3File(file) {
  const hasMime = allowedMimes.has(file.mimetype);
  const hasExt = /\.mp3$/i.test(file.originalname || "");
  return hasMime || hasExt;
}

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (!isMp3File(file)) {
      return cb(new Error("Only MP3 files are allowed. Please upload a .mp3 file."));
    }
    cb(null, true);
  },
});

// Helper to build an absolute URL for a stored file
function absUrl(req, relativePath) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${relativePath}`;
}

// GET /api/songs - list songs (optional `q` search param)
router.get("/", auth, async (req, res) => {
  const q = (req.query.q || "").trim();
  const filter = q
    ? { $or: [{ title: { $regex: q, $options: "i" } }, { artist: { $regex: q, $options: "i" } }] }
    : {};
  const songs = await Song.find(filter).sort({ createdAt: -1 }).lean();
  const normalized = songs.map((s) => ({
    _id: String(s._id),
    title: s.title,
    artist: s.artist,
    filePath: absUrl(req, `/uploads/${s.filename}`),
    coverPath: "",
    external: false,
  }));
  res.json(normalized);
});

// POST /api/songs/upload - upload an MP3 file using multipart/form-data
router.post("/upload", auth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      // Multer or validation error
      const msg = err.message || "Upload error";
      return res.status(400).json({ message: msg });
    }
    try {
      if (!req.file) return res.status(400).json({ message: "MP3 file required" });

      const titleRaw = req.body.title || "";
      const finalTitle =
        titleRaw.trim() ||
        (req.file.originalname ? req.file.originalname.replace(/\.[^/.]+$/, "") : "Untitled");
      const artist = req.body.artist?.trim() || "Unknown";

      const song = await Song.create({
        title: finalTitle,
        artist,
        filename: req.file.filename,
        owner: req.user.id,
      });

      return res.json({
        _id: String(song._id),
        title: song.title,
        artist: song.artist,
        filePath: absUrl(req, `/uploads/${song.filename}`),
        coverPath: "",
        external: false,
      });
    } catch (e) {
      return res.status(500).json({ message: "Server error saving file" });
    }
  });
});

// GET /api/songs/:id/download - download an uploaded MP3 by id
router.get("/:id/download", auth, async (req, res) => {
  const id = req.params.id;
  const song = await Song.findById(id);
  if (!song) return res.status(404).json({ message: "Not found" });
  const filePath = path.join(uploadsDir, song.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File missing" });
  res.download(filePath, `${song.title}.mp3`);
});

module.exports = router;