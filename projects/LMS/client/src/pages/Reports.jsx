/**
 * Reports Page - View library statistics and analytics
 * Generate insights from library data
 * Simple frontend charts using HTML/CSS (no external library)
 * Later: Could integrate Chart.js for more advanced visualizations
 */

import { useLibrary } from '../context/LibraryContext'

const Reports = () => {
  const { getStatistics, getAllIssuedBooks } = useLibrary()
  const stats = getStatistics()
  const issuedBooks = getAllIssuedBooks()

  // Calculate occupancy percentage
  const occupancyPercentage = stats.totalCopies > 0 
    ? Math.round((stats.issuedCopies / stats.totalCopies) * 100)
    : 0

  // Overdue percentage
  const overduePercentage = stats.activeIssues > 0
    ? Math.round((stats.overdueBooks / stats.activeIssues) * 100)
    : 0

  // Get top categories
  const topCategories = Object.entries(stats.categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="w-full min-h-screen py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Library Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Analytics and insights from library data</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Books Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">📚 Books Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Total Books</span>
                  <span className="text-sm font-bold">{stats.totalBooks}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Available Copies</span>
                  <span className="text-sm font-bold">{stats.availableCopies} / {stats.totalCopies}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats.totalCopies > 0 ? (stats.availableCopies / stats.totalCopies) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Availability:{' '}
                  {stats.totalCopies > 0
                    ? `${((stats.availableCopies / stats.totalCopies) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Issued Copies</span>
                  <span className="text-sm font-bold">{stats.issuedCopies} / {stats.totalCopies}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Occupancy: {occupancyPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Issue Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">📤 Issue Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Active Issues</span>
                  <span className="text-sm font-bold">{stats.activeIssues - stats.overdueBooks}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: stats.activeIssues > 0
                        ? `${((stats.activeIssues - stats.overdueBooks) / stats.activeIssues) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overdue Books</span>
                  <span className="text-sm font-bold text-red-600">{stats.overdueBooks}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: stats.activeIssues > 0
                        ? `${(stats.overdueBooks / stats.activeIssues) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Overdue Rate: {overduePercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Books by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-6">📖 Books by Category</h2>
            <div className="space-y-4">
              {topCategories.map(([category, count]) => {
                const maxCount = Math.max(...Object.values(stats.categoryCount))
                const percentage = (count / maxCount) * 100

                return (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-6">📈 Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded">
                <span className="text-sm">Unique Books in Library</span>
                <span className="text-2xl font-bold text-blue-600">{stats.totalBooks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900 rounded">
                <span className="text-sm">Total Copies Available</span>
                <span className="text-2xl font-bold text-green-600">{stats.totalCopies}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900 rounded">
                <span className="text-sm">Currently Active Issues</span>
                <span className="text-2xl font-bold text-purple-600">{stats.activeIssues}</span>
              </div>
              <div className={`flex justify-between items-center p-3 ${
                stats.overdueBooks > 0
                  ? 'bg-red-50 dark:bg-red-900'
                  : 'bg-green-50 dark:bg-green-900'
              } rounded`}>
                <span className="text-sm">Overdue Issues</span>
                <span className={`text-2xl font-bold ${
                  stats.overdueBooks > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats.overdueBooks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-6">🎯 Category Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.categoryCount).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category}</p>
                <p className="text-3xl font-bold text-primary">{count}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {((count / stats.totalBooks) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">💡 Insights</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold">Inventory Health</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {occupancyPercentage < 30
                    ? '✓ Library has good availability of books'
                    : occupancyPercentage < 70
                    ? '⚠ Library is moderately busy'
                    : '⚠ Library has high demand, consider acquiring more copies'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-semibold">Collection Diversity</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Library has books across {stats.categories.length} categories. Most popular: {
                    topCategories[0] ? topCategories[0][0] : 'N/A'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold">Return Discipline</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {overduePercentage < 10
                    ? '✓ Students are returning books on time'
                    : overduePercentage < 25
                    ? '⚠ Some late returns - consider reminders'
                    : '⚠ High overdue rate - implement follow-up system'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
