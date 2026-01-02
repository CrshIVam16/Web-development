/**
 * Date Utility Functions
 * Handles date calculations for issue/return logic
 * Later: Date handling could be moved to backend for consistency
 */

/**
 * Calculate due date based on issue date and duration
 * @param {Date} issueDate - Date when book was issued
 * @param {number} days - Number of days to issue (7 or 14)
 * @returns {Date} Due date
 */
export const calculateDueDate = (issueDate, days = 7) => {
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + days)
  return dueDate
}

/**
 * Check if book is overdue
 * @param {Date} dueDate - Due date of the book
 * @returns {boolean} True if overdue
 */
export const isOverdue = (dueDate) => {
  return new Date() > new Date(dueDate)
}

/**
 * Calculate fine amount based on overdue days
 * @param {Date} dueDate - Due date of the book
 * @param {number} dailyFine - Fine per day (in ₹)
 * @returns {number} Total fine amount
 */
export const calculateFine = (dueDate, dailyFine = 10) => {
  if (!isOverdue(dueDate)) return 0
  
  const due = new Date(dueDate)
  const today = new Date()
  const overdueDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24))
  return Math.max(0, overdueDays * dailyFine)
}

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date)
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return d.toLocaleDateString('en-IN', options)
}

/**
 * Get days until due date
 * @param {Date} dueDate - Due date
 * @returns {number} Days remaining (negative if overdue)
 */
export const daysUntilDue = (dueDate) => {
  const due = new Date(dueDate)
  const today = new Date()
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

/**
 * Check if due date is within warning period (2 days)
 * @param {Date} dueDate - Due date
 * @returns {boolean} True if within 2 days
 */
export const isNearDue = (dueDate) => {
  const days = daysUntilDue(dueDate)
  return days > 0 && days <= 2
}
