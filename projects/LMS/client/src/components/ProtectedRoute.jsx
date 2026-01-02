/**
 * ProtectedRoute - Guards routes that require authentication
 * Redirects unauthenticated users to login
 * Can also enforce role-based access
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl mb-2">Loading...</p>
          <div className="animate-spin text-3xl">⏳</div>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role if required
  if (requiredRole) {
    // Allow legacy `main_librarian` to pass when `librarian` is required
    const roleMatches =
      requiredRole === 'librarian'
        ? user.role === 'librarian' || user.role === 'main_librarian'
        : user.role === requiredRole

    if (!roleMatches) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-red-600 font-bold mb-2">Access Denied</p>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole}</p>
          </div>
        </div>
      )
    }
  }

  // ✅ IMPORTANT: If allowed, render the page
  return children
}

export default ProtectedRoute