/**
 * App.jsx - Main application entry for the React frontend
 *
 * Responsibilities:
 * - Compose Context providers (`AuthProvider`, `LibraryProvider`) so contexts are
 *   available throughout the app.
 * - Define application routes and protect them with `ProtectedRoute` for role-based
 *   access control.
 * - Manage a simple theme toggle (light/dark) persisted in localStorage.
 *
 * Routing notes:
 * - Public routes: `/login`, `/signup`
 * - Student routes (protected): `/books`, `/book/:id`, `/my-books`
 * - Librarian routes (protected, requiredRole='librarian'): `/admin`, `/issue-return`
 *
 * Where backend will integrate:
 * - Data shown in pages will come from API endpoints (e.g., GET /api/books)
 * - AuthContext should be replaced by a token-based login flow once backend is available.
 */

import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { LibraryProvider } from './context/LibraryContext'

// Pages
import AdminDashboard from './pages/AdminDashboard'
import BookDetails from './pages/BookDetails'
import Books from './pages/Books'
import IssueReturn from './pages/IssueReturn'
import Login from './pages/Login'
import Reports from './pages/Reports'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'

function AppContent() {
  const [theme, setTheme] = useState(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Update theme
  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Student Routes */}
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <Books />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute>
                <BookDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-books"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Librarian Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="librarian">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issue-return"
            element={
              <ProtectedRoute requiredRole="librarian">
                <IssueReturn />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/books" />} />
          <Route path="*" element={<Navigate to="/books" />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <Router>
          <AppContent />
        </Router>
      </LibraryProvider>
    </AuthProvider>
  )
}
