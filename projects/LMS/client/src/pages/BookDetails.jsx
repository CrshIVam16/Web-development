/**
 * BookDetails - Shows details for a single book
 * Fix: wait for LibraryContext loading so we don't redirect too early.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'

const BookDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getBookById, loading } = useLibrary()

  const numericId = useMemo(() => Number(id), [id])
  const [book, setBook] = useState(null)

  // Prevent double "recently viewed" updates in React StrictMode
  const lastLoadedIdRef = useRef(null)

  useEffect(() => {
    if (loading) return
    if (!Number.isFinite(numericId)) {
      setBook(null)
      return
    }

    // Avoid re-running same ID twice (StrictMode)
    if (lastLoadedIdRef.current === numericId) return
    lastLoadedIdRef.current = numericId

    const found = getBookById(numericId)
    setBook(found || null)
  }, [loading, numericId, getBookById])

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading book...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h1 className="text-xl font-bold mb-2">Book not found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This book may have been removed or the link is invalid.
            </p>
            <button
              onClick={() => navigate('/books')}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Back to Books
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-primary hover:underline"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center text-6xl">
              {book.image || '📖'}
            </div>

            <div className="md:col-span-2">
              <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                by {book.author}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {book.category} • {book.publishedYear}
              </p>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {book.description}
              </p>

              <div className="flex gap-3 items-center">
                <span
                  className={`px-3 py-1 rounded text-sm font-semibold ${(book.availableCopies || 0) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                  {(book.availableCopies || 0)} available
                </span>

                <button
                  onClick={() => navigate('/books')}
                  className="ml-auto bg-gray-200 dark:bg-gray-700 py-2 px-4 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Back to list
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">More from this category</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Coming soon (frontend-only placeholder).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetails