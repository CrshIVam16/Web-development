// Server entry: Express API with JWT auth, file uploads, and external music integration
// server/index.js - Application entry point
// - Loads environment variables, connects to MongoDB, and starts the Express server
// - Mounts API routes and serves uploaded files from /uploads
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const songRoutes = require("./routes/songs");
const externalSongRoutes = require("./routes/externalSongs");
const playlistRoutes = require("./routes/playlists");

const app = express();

// Middlewares
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // Simple request logger for development

// Serve uploaded MP3 files from the `uploads` folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount API route modules
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/external-songs", externalSongRoutes);
app.use("/api/playlists", playlistRoutes);

// Start server after DB connection succeeds
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
});