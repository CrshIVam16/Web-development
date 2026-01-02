/**
 * Books Page
 *
 * Responsibilities:
 * - Display a searchable, filterable grid of books.
 * - Allow students to issue books (via `BookCard` -> `issueBook` in LibraryContext).
 * - Keep UI logic separate from state management: all data comes from `useLibrary()`.
 *
 * Implementation detail for viva:
 * - Filtering and searching are performed on the client using the list returned by
 *   `getAllBooks()`. In a real app these would be server-backed endpoints for
 *   pagination and performance on large datasets.
 */

import { useMemo, useState } from 'react'
import BookCard from '../components/BookCard'
import { useLibrary } from '../context/LibraryContext'
import { categories } from '../utils/mockBooks'

const Books = () => {
  const libraryContext = useLibrary()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  if (!libraryContext) {
    return <div className="w-full min-h-screen flex items-center justify-center text-white">Loading library...</div>
  }

  const { getAllBooks, searchBooks } = useLibrary()
  const allBooks = getAllBooks()

  // Memoized filtered books for performance
  const filteredBooks = useMemo(() => {
    let list = allBooks
    if (searchQuery.trim()) {
      list = searchBooks(searchQuery)
    }
    if (selectedCategory !== 'All') {
      list = list.filter(b => b.category === selectedCategory)
    }
    return list
  }, [allBooks, searchBooks, searchQuery, selectedCategory])

  return (
    <div className="w-full min-h-screen py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">📚 Library Books</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Browse and search our collection of {allBooks.length} books
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 bg-white text-gray-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} variant="view" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">No books found</p>
            <p className="text-gray-500 dark:text-gray-500">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Books
