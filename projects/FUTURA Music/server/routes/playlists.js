// routes/playlists.js - CRUD for user playlists
// Playlists are user-scoped: every operation filters by `req.user.id` to avoid cross-user access.
const express = require("express");
const auth = require("../middleware/auth");
const Playlist = require("../models/Playlist");

const router = express.Router();

// GET /api/playlists: List current user's playlists
router.get("/", auth, async (req, res) => {
  const pls = await Playlist.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(pls);
});

// POST /api/playlists: Create a new playlist owned by the current user
router.post("/", auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "name required" });
  const pl = await Playlist.create({ name, user: req.user.id, songs: [] });
  res.json(pl);
});

// POST /api/playlists/:id/add: Add a song snapshot to the playlist (avoids duplicates)
router.post("/:id/add", auth, async (req, res) => {
  const { id } = req.params;
  const { song } = req.body;
  if (!song || !song._id) return res.status(400).json({ message: "song required" });

  const pl = await Playlist.findOne({ _id: id, user: req.user.id });
  if (!pl) return res.status(404).json({ message: "Playlist not found" });

  // Prevent duplicate songs by checking the stored snapshot `_id` field
  const exists = pl.songs.some((s) => s._id === song._id);
  if (!exists) pl.songs.push(song);
  await pl.save();
  res.json(pl);
});

// POST /api/playlists/:id/remove: Remove a song from the playlist by its `_id`
router.post("/:id/remove", auth, async (req, res) => {
  const { id } = req.params;
  const { songId } = req.body;
  const pl = await Playlist.findOne({ _id: id, user: req.user.id });
  if (!pl) return res.status(404).json({ message: "Playlist not found" });
  pl.songs = pl.songs.filter((s) => s._id !== songId);
  await pl.save();
  res.json(pl);
});

module.exports = router;