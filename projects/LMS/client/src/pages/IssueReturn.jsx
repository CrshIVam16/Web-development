/**
 * Issue/Return Page - Manage book issues and returns
 * For librarian use - view and manage all transactions
 *
 * POLICY:
 * - Librarian can return ONLY if a pending return request exists.
 */

import { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import { useLibrary } from '../context/LibraryContext'
import { calculateFine, formatDate, isOverdue } from '../utils/dateUtils'

const IssueReturn = () => {
  const {
    getAllIssuedBooks,
    returnBook,
    returnRequests = [],
    clearReturnRequest
  } = useLibrary()

  const [filter, setFilter] = useState('all') // all, active, overdue
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)

  // Always read live data from context
  const issuedBooks = getAllIssuedBooks()

  const hasPendingRequest = (issueId) =>
    (returnRequests || []).some(
      (r) => r.status === 'pending' && String(r.issueId) === String(issueId)
    )

  const handleReturn = () => {
    if (!selectedIssue) return

    // ✅ Enforce rule: must have request
    if (!hasPendingRequest(selectedIssue.id)) {
      alert('Return not allowed: No return request found for this book.')
      return
    }

    if (returnBook(selectedIssue.id)) {
      clearReturnRequest(selectedIssue.id) // ✅ remove request after success
      alert('Book returned successfully!')
      setShowReturnModal(false)
      setSelectedIssue(null)
    } else {
      alert('Failed to return book')
    }
  }

  const filteredBooks = useMemo(() => {
    switch (filter) {
      case 'active':
        return issuedBooks.filter((b) => !isOverdue(b.dueDate))
      case 'overdue':
        return issuedBooks.filter((b) => isOverdue(b.dueDate))
      default:
        return issuedBooks
    }
  }, [filter, issuedBooks])

  const overdueCount = issuedBooks.filter((b) => isOverdue(b.dueDate)).length
  const totalFine = issuedBooks.reduce((sum, b) => sum + calculateFine(b.dueDate), 0)

  return (
    <div className="w-full min-h-screen py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📤 Issue & Return Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor book issues and handle returns
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Issued</p>
            <p className="text-3xl font-bold text-primary">{issuedBooks.length}</p>
          </div>

          <div className={`${overdueCount > 0 ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'} rounded-lg p-6`}>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Overdue</p>
            <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueCount}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total Outstanding Fine</p>
            <p className="text-3xl font-bold text-purple-600">₹{totalFine}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            All ({issuedBooks.length})
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'active'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            Active ({issuedBooks.length - overdueCount})
          </button>

          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg transition ${filter === 'overdue'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            Overdue ({overdueCount})
          </button>
        </div>

        {/* Return Requests */}
        {returnRequests.length > 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📨 Return Requests</h2>

            <div className="space-y-3">
              {returnRequests.map((req) => {
                const issue = issuedBooks.find((ib) => String(ib.id) === String(req.issueId))

                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {issue?.bookDetails?.title ?? 'Unknown / Already Returned'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Requested at: {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {issue ? (
                        <button
                          onClick={() => {
                            setSelectedIssue(issue)
                            setShowReturnModal(true)
                          }}
                          className="px-3 py-2 bg-primary text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Process
                        </button>
                      ) : (
                        <button
                          onClick={() => clearReturnRequest(req.issueId)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded text-sm"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Issues List */}
        {filteredBooks.length > 0 ? (
          <div className="space-y-4">
            {filteredBooks.map((issue) => {
              const isOverDue = isOverdue(issue.dueDate)
              const fine = calculateFine(issue.dueDate)
              const allowed = hasPendingRequest(issue.id)

              return (
                <div
                  key={issue.id}
                  className={`rounded-lg p-6 border-l-4 ${isOverDue
                      ? 'bg-red-50 dark:bg-red-900 border-red-500'
                      : 'bg-green-50 dark:bg-green-900 border-green-500'
                    }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Book Info */}
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <span className="text-4xl">{issue.bookDetails?.image ?? '📖'}</span>
                        <div>
                          <h3 className="text-xl font-bold">
                            {issue.bookDetails?.title ?? 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {issue.bookDetails?.author ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {issue.bookDetails?.category ?? 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Issued</p>
                          <p className="font-semibold">{formatDate(issue.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Due</p>
                          <p className={`font-semibold ${isOverDue ? 'text-red-600' : 'text-green-600'}`}>
                            {formatDate(issue.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className={`p-3 rounded mb-4 ${isOverDue ? 'bg-red-100 dark:bg-red-800' : 'bg-green-100 dark:bg-green-800'}`}>
                          <p className={`text-sm font-bold ${isOverDue ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}`}>
                            {isOverDue ? '🔴 OVERDUE' : '🟢 ACTIVE'}
                          </p>

                          {isOverDue && (
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              Fine: ₹{fine} (
                              {Math.ceil((new Date() - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24))} days)
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        disabled={!allowed}
                        onClick={() => {
                          setSelectedIssue(issue)
                          setShowReturnModal(true)
                        }}
                        className={`w-full py-2 rounded font-semibold transition ${allowed
                            ? isOverDue
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-primary hover:bg-blue-600 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {allowed ? 'Return Book' : 'Awaiting Request'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
              {filter === 'all'
                ? 'No books issued'
                : filter === 'overdue'
                  ? 'No overdue books! ✓'
                  : 'No active issues'}
            </p>
          </div>
        )}
      </div>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={showReturnModal}
        title="Return Book"
        onClose={() => setShowReturnModal(false)}
        actions={[
          { label: 'Confirm Return', onClick: handleReturn, variant: 'primary' },
          { label: 'Cancel', onClick: () => setShowReturnModal(false), variant: 'secondary' }
        ]}
      >
        {selectedIssue && (
          <div>
            <p className="mb-4">
              Are you sure you want to return{' '}
              <strong>{selectedIssue.bookDetails?.title ?? 'this book'}</strong>?
            </p>

            {!hasPendingRequest(selectedIssue.id) && (
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded mb-4">
                <p className="font-bold text-yellow-800 dark:text-yellow-200">
                  Return is blocked because no request was sent by the student.
                </p>
              </div>
            )}

            {calculateFine(selectedIssue.dueDate) > 0 && (
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded mb-4">
                <p className="font-bold text-red-800 dark:text-red-200">
                  Outstanding Fine: ₹{calculateFine(selectedIssue.dueDate)}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This fine will be collected from the student.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default IssueReturn