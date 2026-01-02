/**
 * Login page
 * - Requires: email, password, role
 * - Redirects: students -> /books, librarians -> /admin
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'student' ? '/books' : '/admin')
    }
  }, [user, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Call login with email, password, and role
    const result = login(email, password, role)
    
    if (result.ok) {
      // Redirect based on role
      // Note: user state updates via setUser in login function
      setTimeout(() => {
        navigate(role === 'student' ? '/books' : '/admin')
      }, 0)
    } else {
      // Show error message inline
      setError(result.message)
    }
  }

  const isDisabled = !email || !password || !role

  return (
    <AuthCard title="Smart Library" subtitle="Sign in to your account" className="dark:bg-gray-900">
      {/* Removed in-card toggle — navbar controls active page */}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Role Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">Login as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="student">Student</option>
            <option value="librarian">Librarian</option>
          </select>
        </div>

        {/* Submit Button */}
        <button disabled={isDisabled} className="w-full bg-blue-600 disabled:opacity-50 text-white py-2 rounded-lg transition font-semibold mt-6">
          Login
        </button>
      </form>

      {/* Signup Link */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary hover:underline font-semibold">
          Sign up
        </Link>
      </p>
    </AuthCard>
  )
}

export default Login
