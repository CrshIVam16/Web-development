// models/Playlist.js - Simple playlist document
// The `songs` array stores lightweight snapshots of song metadata so playlists remain usable even if the original `Song` document is deleted.
const mongoose = require("mongoose");

const playlistSongSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // local mongo id OR "deezer:123"
  title: String,
  artist: String,
  filePath: String,
  coverPath: String,
  external: Boolean,
});

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    songs: [playlistSongSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Playlist", playlistSchema);