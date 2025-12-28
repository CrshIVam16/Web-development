// models/Song.js - Stores metadata for MP3 files uploaded by users
// The actual file is stored on disk inside `uploads/`; `filename` stores the disk filename.
const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown" },
    filename: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);