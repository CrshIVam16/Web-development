// models/User.js - Mongoose model for application users
// Fields:
// - name: display name (optional)
// - email: unique identifier for login
// - passwordHash: hashed password produced by bcrypt
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);