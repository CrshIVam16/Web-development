/**
 * Storage Utility Functions
 * Manages localStorage operations for auth and library data
 * Later: All these will be replaced with API calls
 */

// NOTE:
// These helpers are intentionally minimal wrappers around localStorage for the
// purposes of the frontend demo. They provide predictable, testable behavior
// without requiring a backend. When this project moves to a real backend,
// replace calls to these helpers with network requests and remove sensitive
// data from client-side storage.

const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  BOOKS: 'library_books',
  ISSUED_BOOKS: 'issued_books',
  RECENTLY_VIEWED: 'recently_viewed',
  USERS: 'registered_users',
  RETURN_REQUESTS: 'return_requests'
}

// Safe JSON helpers (prevents blank screens if localStorage has bad JSON)
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn(`Failed to parse localStorage key: ${key}`, e)
    return fallback
  }
}

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

/**
 * Return Requests (frontend-only)
 * Later: replace with backend DB + APIs
 * POST /api/returns/request
 * GET /api/returns/requests
 */

export const getReturnRequests = () => readJSON(STORAGE_KEYS.RETURN_REQUESTS, [])

export const saveReturnRequests = (requests) => {
  writeJSON(STORAGE_KEYS.RETURN_REQUESTS, requests)
}

/**
 * Add a return request (no duplicates for same issueId)
 * @returns {boolean} true if added, false if already exists
 */
export const addReturnRequest = ({ issueId, userId }) => {
  const list = getReturnRequests()
  const exists = list.some((r) => String(r.issueId) === String(issueId) && r.status === 'pending')
  if (exists) return false

  const request = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    issueId,
    userId,
    status: 'pending',
    requestedAt: new Date().toISOString()
  }

  saveReturnRequests([request, ...list])
  return true
}

export const removeReturnRequestByIssueId = (issueId) => {
  const list = getReturnRequests()
  const updated = list.filter((r) => String(r.issueId) !== String(issueId))
  saveReturnRequests(updated)
}

/**
 * Save user auth data to localStorage
 * Later: Will be replaced with JWT token storage
 */
export const saveAuthUser = (user) => {
  writeJSON(STORAGE_KEYS.AUTH_USER, user)
}

/**
 * Get current authenticated user
 * Later: Replace with JWT verification
 */
export const getAuthUser = () => readJSON(STORAGE_KEYS.AUTH_USER, null)

/**
 * Clear auth user from storage (logout)
 */
export const clearAuthUser = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
}

/**
 * Save books list to localStorage
 */
export const saveBooks = (books) => {
  writeJSON(STORAGE_KEYS.BOOKS, books)
}

/**
 * Get books from localStorage
 */
export const getBooks = () => readJSON(STORAGE_KEYS.BOOKS, [])

/**
 * Save issued books record
 * Later: Will be stored in MongoDB with timestamps
 */
export const saveIssuedBooks = (issuedBooks) => {
  writeJSON(STORAGE_KEYS.ISSUED_BOOKS, issuedBooks)
}

/**
 * Get issued books record
 */
export const getIssuedBooks = () => readJSON(STORAGE_KEYS.ISSUED_BOOKS, [])

/**
 * Save all users to storage (frontend-only)
 * Later: Replace with backend API
 */
export const saveUsers = (users) => {
  writeJSON(STORAGE_KEYS.USERS, users)
}

/**
 * Get all registered users (frontend-only)
 * Later: Replace with backend API
 */
export const getUsers = () => readJSON(STORAGE_KEYS.USERS, [])

/**
 * Save a single user (frontend-only helper)
 * Prevents duplicate by email+role
 */
export const saveUser = (user) => {
  const users = getUsers()
  const exists = users.some((u) => u.email === user.email && u.role === user.role)
  if (exists) return
  saveUsers([...users, user])
}

/**
 * Add to recently viewed books
 * NOTE: This is global currently (not per-user).
 * Later: Make it per-user using key like `recently_viewed_${userId}`.
 */
export const addToRecentlyViewed = (book) => {
  const recentArray = readJSON(STORAGE_KEYS.RECENTLY_VIEWED, [])

  // Remove duplicates and keep only last 5
  const filtered = recentArray.filter((b) => b.id !== book.id)
  filtered.unshift(book)

  writeJSON(STORAGE_KEYS.RECENTLY_VIEWED, filtered.slice(0, 5))
}

/**
 * Get recently viewed books
 */
export const getRecentlyViewed = () => readJSON(STORAGE_KEYS.RECENTLY_VIEWED, [])

/**
 * Clear all library data (for testing/reset)
 */
export const clearAllLibraryData = () => {
  localStorage.removeItem(STORAGE_KEYS.BOOKS)
  localStorage.removeItem(STORAGE_KEYS.ISSUED_BOOKS)
  localStorage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED)
}

/**
 * Optional: Clear everything including auth + users (use carefully)
 */
export const clearAllAppData = () => {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
}