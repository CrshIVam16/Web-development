/**
 * AuthContext - Authentication helper (frontend-only)
 *
 * Purpose:
 * - Provide a lightweight authentication layer for the demo frontend using React Context.
 * - Persist the current logged-in user into localStorage so the session survives reloads.
 * - Offer methods used by pages/components: `login`, `signup`, `logout`, `createStudent`.
 *
 * Key design notes (frontend demo):
 * - This is NOT secure or suitable for production. Passwords are stored in localStorage
 *   only for demonstration. A real backend would return hashed passwords and JWT tokens.
 * - Roles supported: 'student' and 'librarian' (we also accept legacy 'main_librarian' in checks).
 * - Signup creates students only. Librarians are expected to be created by other librarians
 *   via an admin panel (see `createStudent`). This models common role-based user flows.
 *
 * Data flow summary:
 * - On mount, we seed demo users into localStorage if none exist (for evaluation only).
 * - `login(email,password,role)` reads users from storage, matches by email+role,
 *   and stores a session object (without password) into localStorage via `saveAuthUser`.
 * - `signup` adds a student to the users list and auto-logs them in (frontend-only).
 * - `createStudent(currentUser, ...)` is a helper for librarian-to-create-student flows.
 *
 * Future backend integration:
 * - Replace `getUsers`/`saveUsers` with API calls: POST /api/auth/signup, POST /api/auth/login
 * - Replace `saveAuthUser` with storing a secure JWT (httpOnly cookie or secure storage)
 */

import React, { createContext, useEffect, useState } from 'react'
import { clearAuthUser, getAuthUser, getUsers, saveAuthUser, saveUsers } from '../utils/storageUtils'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize user from localStorage on mount
  useEffect(() => {
    // Seed demo users on first load
    // Later: Backend will manage users and roles
    
    const users = getUsers()
    if (users.length === 0) {
      const demoUsers = [
        {
          id: 'admin_001',
          name: 'Admin',
          email: 'admin@email.com',
          password: 'admin123',
          role: 'librarian',
          createdAt: new Date().toISOString()
        },
        {
          id: 'student_001',
          name: 'Student1',
          email: 'student1@email.com',
          password: 'student123',
          role: 'student',
          createdAt: new Date().toISOString()
        }
      ]
      saveUsers(demoUsers)
    }

    const savedUser = getAuthUser()
    if (savedUser) {
      setUser(savedUser)
    }
    setLoading(false)
  }, [])

  /**
   * Login user with email, password, and role
   * Later: POST /api/auth/login -> JWT token from backend
   * Note: passwords stored only for demo (NOT secure). Real app uses JWT + hashing.
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role ('student' or 'librarian')
   * @returns {object} { ok: boolean, message?: string }
   */
  const login = (email, password, role) => {
    // Frontend validation
    if (!email || !password || !role) {
      return { ok: false, message: 'Please fill in all fields' }
    }

    // Find user in localStorage (must have signed up first)
    // Match email and role strictly (librarian or student)
    const registeredUsers = getUsers()
    // Allow selecting 'librarian' to match both 'librarian' and legacy 'main_librarian'
    const foundUser = registeredUsers.find(u => {
      if (role === 'librarian') return u.email === email && (u.role === 'librarian' || u.role === 'main_librarian')
      return u.email === email && u.role === role
    })

    if (!foundUser) {
      return { ok: false, message: 'No account found. Please sign up first or check your role selection.' }
    }

    // Check password (insecure frontend-only demo)
    if (foundUser.password !== password) {
      return { ok: false, message: 'Incorrect password.' }
    }

    // Success: save auth user (exclude password from session)
    const authUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      loginTime: new Date().toISOString()
    }
    saveAuthUser(authUser)
    setUser(authUser)

    return { ok: true }
  }

  /**
  * Signup new user - Students only
  * Later: POST /api/auth/signup -> backend validation + hashing
  * Note: Librarians are created by librarians from the admin panel (see createStudent)
   * @param {string} name - Full name
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {object} { ok: boolean, message?: string }
   */
  const signup = (name, email, password) => {
    // Validation
    if (!name || !email || !password) {
      return { ok: false, message: 'Please fill in all fields' }
    }

    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters' }
    }

    if (!email.includes('@')) {
      return { ok: false, message: 'Please enter a valid email' }
    }

    // Check if student already exists
    const registeredUsers = getUsers()
    if (registeredUsers.some(u => u.email === email && u.role === 'student')) {
      return { ok: false, message: 'Account already exists with this email' }
    }

    // Create new student (role always 'student' for signup)
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role: 'student',
      createdAt: new Date().toISOString()
    }

    // Save to users list
    const updatedUsers = [...registeredUsers, newUser]
    saveUsers(updatedUsers)

    // Log user in immediately (auto-login after signup)
    const authUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
    saveAuthUser(authUser)
    setUser(authUser)

    return { ok: true }
  }

  /**
   * Create new student - Librarian only
   * Allows a logged-in librarian to create student accounts from admin panel
   * @param {object} currentUser - Currently logged-in user (must be librarian)
   * @param {string} name - Full name
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {object} { ok: boolean, message?: string }
   */
  const createStudent = (currentUser, name, email, password) => {
    // Only librarians can create student accounts
    if (!currentUser || currentUser.role !== 'librarian') {
      return { ok: false, message: 'Only librarians can create student accounts' }
    }

    if (!name || !email || !password) {
      return { ok: false, message: 'Please fill in all fields' }
    }

    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters' }
    }

    if (!email.includes('@')) {
      return { ok: false, message: 'Please enter a valid email' }
    }

    // Check if user already exists
    const registeredUsers = getUsers()
    if (registeredUsers.some(u => u.email === email)) {
      return { ok: false, message: 'Email already registered' }
    }

    // Create new student user
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role: 'student',
      createdAt: new Date().toISOString()
    }

    // Save to users list
    const updatedUsers = [...registeredUsers, newUser]
    saveUsers(updatedUsers)

    return { ok: true, user: newUser }
  }

  /**
   * Logout current user
   */
  const logout = () => {
    clearAuthUser()
    setUser(null)
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return user !== null
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  const hasRole = (role) => {
    return user?.role === role
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated,
    hasRole,
    createStudent
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
