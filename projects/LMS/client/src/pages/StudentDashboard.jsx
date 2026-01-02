/**
 * Student Dashboard - Shows issued books and due dates
 * Displays overdue alerts and recently viewed books
 *
 * POLICY:
 * - Students can ISSUE books
 * - Students cannot RETURN directly
 * - Students can REQUEST RETURN (stored in localStorage)
 * - Librarian processes return in Issue/Return page
 *
 * Later (backend): POST /api/returns/request
 */

import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { calculateFine, daysUntilDue, formatDate, isNearDue, isOverdue } from '../utils/dateUtils'

const StudentDashboard = () => {
  const { user } = useAuth()
  const {
    getStudentBooks,
    getRecentlyViewedBooks,
    requestReturn,
    returnRequests = []
  } = useLibrary()

  const issuedBooks = useMemo(() => {
    if (!user?.id) return []
    return getStudentBooks(user.id)
  }, [user?.id, getStudentBooks])

  const recentBooks = getRecentlyViewedBooks()

  const [selectedIssue, setSelectedIssue] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestStatusMsg, setRequestStatusMsg] = useState('')

  const overdueBooks = issuedBooks.filter((b) => isOverdue(b.dueDate))
  const activeBooks = issuedBooks.filter((b) => !isOverdue(b.dueDate))
  const nearDueBooks = activeBooks.filter((b) => isNearDue(b.dueDate))

  const hasPendingRequest = (issueId) =>
    (returnRequests || []).some(
      (r) => r.status === 'pending' && String(r.issueId) === String(issueId)
    )

  const openRequestReturn = (issue) => {
    if (!user?.id) return

    // ✅ actually store/send request (frontend-only -> localStorage via context)
    const ok = requestReturn(issue.id, user.id)

    setSelectedIssue(issue)
    setRequestStatusMsg(ok ? 'Return request sent to librarian.' : 'Return request already pending.')
    setShowRequestModal(true)
  }

  return (
    <div className="w-full min-h-screen py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-gray-600 dark:text-gray-400">Here&apos;s your library dashboard</p>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Note: Book returns are handled by the librarian. Use “Request Return” and contact the library desk.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Books Issued</p>
            <p className="text-3xl font-bold text-primary">{issuedBooks.length}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Books Due Soon</p>
            <p className="text-3xl font-bold text-green-600">{nearDueBooks.length}</p>
          </div>

          <div
            className={`${overdueBooks.length > 0 ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'
              } rounded-lg p-6`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Overdue Books</p>
            <p className={`text-3xl font-bold ${overdueBooks.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueBooks.length}
            </p>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueBooks.length > 0 && (
          <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="font-bold text-red-800 dark:text-red-200 mb-2">⚠️ You have overdue books!</p>
            <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
              {overdueBooks.map((issue) => (
                <li key={issue.id}>
                  <strong>{issue.bookDetails?.title ?? 'Unknown Book'}</strong> — Due: {formatDate(issue.dueDate)}
                  <span className="ml-2 font-bold">Fine: ₹{calculateFine(issue.dueDate)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issued Books */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">📖 My Issued Books ({issuedBooks.length})</h2>

          {issuedBooks.length > 0 ? (
            <div className="space-y-6">
              {/* Overdue Books */}
              {overdueBooks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Overdue Books</h3>
                  <div className="space-y-3">
                    {overdueBooks.map((issue) => {
                      const requested = hasPendingRequest(issue.id)

                      return (
                        <div
                          key={issue.id}
                          className="bg-red-50 dark:bg-red-900 rounded-lg p-4 border border-red-200 dark:border-red-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-lg">
                                {issue.bookDetails?.title ?? 'Unknown Book'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                by {issue.bookDetails?.author ?? 'Unknown'}
                              </p>
                            </div>
                            <span className="text-2xl">{issue.bookDetails?.image ?? '📖'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Issue Date</p>
                              <p className="font-semibold">{formatDate(issue.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Due Date</p>
                              <p className="font-semibold text-red-600">{formatDate(issue.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Overdue</p>
                              <p className="font-semibold text-red-600">
                                {Math.abs(daysUntilDue(issue.dueDate))} days
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Fine Amount</p>
                              <p className="font-bold text-red-600">₹{calculateFine(issue.dueDate)}</p>
                            </div>
                          </div>

                          <button
                            disabled={requested}
                            onClick={() => openRequestReturn(issue)}
                            className={`w-full py-2 rounded transition font-semibold ${requested
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 dark:bg-gray-800 hover:bg-gray-700 text-white'
                              }`}
                          >
                            {requested ? 'Return Requested' : 'Request Return'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Books */}
              {activeBooks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">
                    Active Books ({activeBooks.length})
                  </h3>

                  <div className="space-y-3">
                    {activeBooks.map((issue) => {
                      const requested = hasPendingRequest(issue.id)

                      return (
                        <div
                          key={issue.id}
                          className={`rounded-lg p-4 border ${isNearDue(issue.dueDate)
                              ? 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700'
                              : 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-lg">
                                {issue.bookDetails?.title ?? 'Unknown Book'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                by {issue.bookDetails?.author ?? 'Unknown'}
                              </p>
                            </div>
                            <span className="text-2xl">{issue.bookDetails?.image ?? '📖'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Issue Date</p>
                              <p className="font-semibold">{formatDate(issue.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Due Date</p>
                              <p className={`font-semibold ${isNearDue(issue.dueDate) ? 'text-orange-600' : 'text-green-600'}`}>
                                {formatDate(issue.dueDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Days Left</p>
                              <p className={`font-semibold ${isNearDue(issue.dueDate) ? 'text-orange-600' : 'text-green-600'}`}>
                                {daysUntilDue(issue.dueDate)} days
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Fine</p>
                              <p className="font-semibold">₹0</p>
                            </div>
                          </div>

                          <button
                            disabled={requested}
                            onClick={() => openRequestReturn(issue)}
                            className={`w-full py-2 rounded transition font-semibold ${requested
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 dark:bg-gray-800 hover:bg-gray-700 text-white'
                              }`}
                          >
                            {requested ? 'Return Requested' : 'Request Return'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">No books issued</p>
              <p className="text-gray-500 dark:text-gray-500">
                Visit the Books section to issue a book
              </p>
            </div>
          )}
        </div>

        {/* Recently Viewed */}
        {recentBooks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">👀 Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentBooks.map((book) => (
                <div key={book.id} className="text-center">
                  <div className="text-4xl mb-2">{book.image}</div>
                  <p className="font-semibold line-clamp-2">{book.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Request Return Modal */}
      <Modal
        isOpen={showRequestModal}
        title="Request Return"
        onClose={() => setShowRequestModal(false)}
        actions={[
          { label: 'OK', onClick: () => setShowRequestModal(false), variant: 'primary' }
        ]}
      >
        {selectedIssue && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{requestStatusMsg}</strong>
            </p>

            <p className="text-sm">
              Book: <strong>{selectedIssue.bookDetails?.title ?? 'this book'}</strong>
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Returns are processed by the librarian from the <strong>Issue/Return</strong> page.
              Please contact the library desk.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm">
              <p><strong>Due:</strong> {formatDate(selectedIssue.dueDate)}</p>
              <p><strong>Current fine (if overdue):</strong> ₹{calculateFine(selectedIssue.dueDate)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StudentDashboard