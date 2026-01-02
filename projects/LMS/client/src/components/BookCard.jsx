/**
 * BookCard - Reusable component for displaying a single book
 *
 * Behavior summary:
 * - Displays title/author/category and availability using the `book` prop.
 * - Shows action buttons depending on `user` role (students can issue) and
 *   `variant` (compact/view/full).
 * - Uses `useLibrary()` to call `issueBook` which updates LibraryContext state
 *   and persists the change to localStorage via the storage helpers.
 *
 * Notes for viva:
 * - All state-changing operations (issue/return) happen via the library context
 *   so components remain simple and focused on UI only.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import Modal from './Modal'

const BookCard = ({ book, onIssue, variant = 'view' }) => {
  const { user } = useAuth()
  const { issueBook } = useLibrary()
  const [issueDays, setIssueDays] = useState(7)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  // Handle issuing a book
  const handleIssue = () => {
    if (!user) {
      navigate('/login')
      return
    }

    const days = Number(issueDays) || 7
    if (issueBook(book.id, user.id, days)) {
      setShowModal(false)
      alert('Book issued successfully!')
      if (onIssue) onIssue(book)
    } else {
      alert('Failed to issue book or no copies available')
    }
  }

  return (
    <>
      <div className={`rounded-lg border ${
        variant === 'compact' ? 'p-2' : 'p-4'
      } hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col justify-between`}>
        {/* Book Image/Icon */}
        <div className="text-5xl text-center mb-3">{book.image || '📖'}</div>

        {/* Book Details */}
        <div className="flex-1">
          <h3 className="font-bold text-lg line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
          <p className="text-xs text-gray-500 mb-2">{book.category}</p>

          {/* Availability Status - single source: availableCopies */}
          <div className="mb-3">
            {(book.availableCopies || 0) > 0 ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                ✓ {book.availableCopies} available
              </span>
            ) : (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                ✗ Not available
              </span>
            )}
          </div>

          {/* Additional Info */}
          {variant === 'full' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {book.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {variant === 'view' && user?.role === 'student' && (book.availableCopies || 0) > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 bg-primary text-white py-2 rounded hover:bg-blue-600 transition text-sm font-semibold"
            >
              Issue
            </button>
          )}

          {variant === 'view' && !user && (
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-primary text-white py-2 rounded hover:bg-blue-600 transition text-sm font-semibold"
            >
              Login to Issue
            </button>
          )}

          <button
            onClick={() => navigate(`/book/${book.id}`)}
            className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
          >
            View Details
          </button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        title="Issue Book"
        onClose={() => setShowModal(false)}
        actions={[
          { label: 'Confirm', onClick: handleIssue, variant: 'primary' },
          { label: 'Cancel', onClick: () => setShowModal(false), variant: 'secondary' }
        ]}
      >
        <p className="mb-4 text-sm">{book.title}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Issue Duration:</label>
          <select
            value={issueDays}
            onChange={(e) => setIssueDays(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
          </select>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded mb-4 text-sm">
          <p>Fine: ₹10 per day if overdue</p>
        </div>
      </Modal>
    </>
  )
}

export default BookCard
