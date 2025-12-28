// config/db.js - MongoDB connection helper using Mongoose
// Usage: call `connectDB()` before starting the HTTP server so DB is ready.
const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("Error: MONGO_URL not set in .env");
    process.exit(1);
  }
  // Mongoose returns a promise; we await it to ensure connection before listen
  await mongoose.connect(uri);
  console.log("✓ MongoDB connected");
}

module.exports = { connectDB };