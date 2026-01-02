/**
 * Admin (Librarian) Dashboard - Manage books and view statistics
 * Add, edit, delete books
 * View issued books and outstanding fines
 * Later: Will interact with backend APIs
 */

import { useState } from 'react'
import Modal from '../components/Modal'
import { useLibrary } from '../context/LibraryContext'  // ✅ required

const AdminDashboard = () => {
  const { getAllBooks, getStatistics, addBook, updateBook, deleteBook, getAllIssuedBooks } = useLibrary()

  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    totalCopies: 1,
    publishedYear: new Date().getFullYear(),
    description: '',
    image: '📖'
  })

  // derive live stats and issued books from context to avoid stale state
  const stats = getStatistics()
  const issuedBooks = getAllIssuedBooks()

  const categories = ['Fiction', 'Science', 'Technology', 'Self-Help', 'History', 'Biography']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: '',
      isbn: '',
      totalCopies: 1,
      publishedYear: new Date().getFullYear(),
      description: '',
      image: '📖'
    })
  }

  const handleSaveBook = () => {
    if (!formData.title || !formData.author) {
      alert('Please fill in title and author')
      return
    }

    if (isEditMode && selectedBook) {
      updateBook(selectedBook.id, formData)
      alert('Book updated successfully!')
    } else {
      addBook(formData)
      alert('Book added successfully!')
    }

    setShowModal(false)
    resetForm()
  }

  const handleDeleteBook = (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return

    const ok = deleteBook(bookId)
    if (!ok) {
      alert('Cannot delete this book because it is currently issued.')
      return
    }

    alert('Book deleted successfully!')
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setSelectedBook(null)
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (book) => {
    setIsEditMode(true)
    setSelectedBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      totalCopies: book.totalCopies,
      publishedYear: book.publishedYear,
      description: book.description,
      image: book.image
    })
    setShowModal(true)
  }

  return (
    <div className="w-full min-h-screen py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">👤 Librarian Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage library books and view statistics
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Books</p>
            <p className="text-3xl font-bold text-primary">{stats.totalBooks}</p>
            <p className="text-xs text-gray-500 mt-2">{stats.totalCopies} copies</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Available</p>
            <p className="text-3xl font-bold text-green-600">{stats.availableCopies}</p>
            <p className="text-xs text-gray-500 mt-2">copies</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Issued</p>
            <p className="text-3xl font-bold text-purple-600">{stats.activeIssues}</p>
            <p className="text-xs text-gray-500 mt-2">active issues</p>
          </div>

          <div
            className={`${stats.overdueBooks > 0 ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'
              } rounded-lg p-6`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Overdue</p>
            <p
              className={`text-3xl font-bold ${stats.overdueBooks > 0 ? 'text-red-600' : 'text-green-600'
                }`}
            >
              {stats.overdueBooks}
            </p>
            <p className="text-xs text-gray-500 mt-2">books</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Books by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.categoryCount).map(([cat, count]) => (
              <div key={cat} className="bg-gray-50 dark:bg-gray-700 rounded p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{cat}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Book Button */}
        <div className="mb-8">
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Add New Book
          </button>
        </div>

        {/* Books Table */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Author</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Available</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {getAllBooks().map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm">{book.title}</td>
                    <td className="px-6 py-4 text-sm">{book.author}</td>
                    <td className="px-6 py-4 text-sm">{book.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${book.availableCopies > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                      >
                        {book.availableCopies}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{book.totalCopies}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(book)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issued Books */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Currently Issued Books</h2>
          {issuedBooks.length > 0 ? (
            <div className="space-y-3">
              {issuedBooks.map((issue) => (
                <div
                  key={issue.id}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <p className="font-semibold">
                      {issue.bookDetails?.title ?? 'Unknown Book'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Issued: {new Date(issue.issueDate).toLocaleDateString()} | Due:{' '}
                      {new Date(issue.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${new Date(issue.dueDate) < new Date()
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                  >
                    {new Date(issue.dueDate) < new Date() ? '🔴 Overdue' : '🟢 Active'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No books currently issued</p>
          )}
        </div>
      </div>

      {/* Add/Edit Book Modal */}
      <Modal
        isOpen={showModal}
        title={isEditMode ? 'Edit Book' : 'Add New Book'}
        onClose={() => setShowModal(false)}
        actions={[
          { label: 'Save', onClick: handleSaveBook, variant: 'primary' },
          { label: 'Cancel', onClick: () => setShowModal(false), variant: 'secondary' }
        ]}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <input
            type="text"
            name="title"
            placeholder="Book Title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            name="author"
            placeholder="Author Name"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="isbn"
            placeholder="ISBN"
            value={formData.isbn}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            name="totalCopies"
            placeholder="Total Copies"
            value={formData.totalCopies}
            onChange={handleInputChange}
            min="1"
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            name="publishedYear"
            placeholder="Published Year"
            value={formData.publishedYear}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <textarea
            name="description"
            placeholder="Book Description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 resize-none"
          />
          <input
            type="text"
            name="image"
            placeholder="Book Icon/Emoji"
            value={formData.image}
            onChange={handleInputChange}
            maxLength="2"
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 text-center"
          />
        </div>
      </Modal>
    </div>
  )
}

export default AdminDashboard