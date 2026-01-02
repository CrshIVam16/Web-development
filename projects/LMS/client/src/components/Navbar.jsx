/**
 * Navbar - Main navigation component
 * Futura-style structure: Brand left (large), Links/Buttons right
 * Responsive: mobile menu for small screens
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand - Extreme Left, Larger */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <span className="text-2xl sm:text-3xl">📚</span>
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hidden sm:inline group-hover:text-primary transition">
            Smart Library
          </span>
        </Link>

        {/* Mobile Menu Button (visible only on mobile) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Right Section: Desktop View */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {/* Role-based Links */}
              {user.role === 'student' && (
                <>
                  <Link to="/books" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Books
                  </Link>
                  <Link to="/my-books" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    My Books
                  </Link>
                  <Link to="/reports" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Reports
                  </Link>
                </>
              )}

              {user.role === 'librarian' && (
                <>
                  <Link to="/admin" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Dashboard
                  </Link>
                  <Link to="/books" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Books
                  </Link>
                  <Link to="/issue-return" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Issue/Return
                  </Link>
                  <Link to="/reports" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition">
                    Reports
                  </Link>
                </>
              )}

              {/* User Info */}
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                {user.name}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Login Button */}
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${location.pathname === '/login' ? 'bg-primary text-white border border-primary' : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Login
              </Link>

              {/* Sign Up Button */}
              <Link
                to="/signup"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${location.pathname === '/signup'
                    ? 'bg-primary text-white border border-primary'
                    : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                {/* User Info */}
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {user.name} ({user.role})
                </div>

                {/* Role-based Links Mobile */}
                {user.role === 'student' && (
                  <>
                    <Link to="/books" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Books</Link>
                    <Link to="/my-books" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">My Books</Link>
                    <Link to="/reports" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Reports</Link>
                  </>
                )}

                {user.role === 'librarian' && (
                  <>
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Dashboard</Link>
                    <Link to="/books" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Books</Link>
                    <Link to="/issue-return" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Issue/Return</Link>
                    <Link to="/reports" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary py-2">Reports</Link>
                  </>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex-1 p-2 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-center transition">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 text-center transition">Sign Up</Link>
                <button
                  onClick={() => {
                    toggleTheme()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
