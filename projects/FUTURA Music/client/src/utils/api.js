// api.js - Lightweight wrapper around fetch for this project.
// Purpose:
// - Centralize the base API URL
// - Attach JWT Authorization header when available
// - Normalize JSON responses and provide a small `download` helper
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Get JWT token from localStorage for Authorization header
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Make HTTP request with auth headers
async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };
  
  // Don't set Content-Type for FormData (browser will set boundary)
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Use the global `fetch` API; the backend routes are mounted under `/api`
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = JSON.stringify(data);
    } catch (_) {
      try {
        msg = await res.text();
      } catch (_) { }
    }
    throw new Error(msg);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res;
}

export const api = {
  BASE,
  get: (p) => request(p),
  post: (p, body) => request(p, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  del: (p) => request(p, { method: "DELETE" }),
  download: async (path, filename) => {
    const res = await fetch(`${BASE}${path}`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};