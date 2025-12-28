// middleware/auth.js - Simple JWT authentication middleware
// Verifies the `Authorization: Bearer <token>` header and attaches `req.user`.
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    // jwt.verify will throw if token is invalid or expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach a minimal user object for route handlers to use
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = auth;