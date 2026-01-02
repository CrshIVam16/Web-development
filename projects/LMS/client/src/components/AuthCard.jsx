/**
 * AuthCard - Visual wrapper for authentication pages (Login / Signup)
 *
 * Purpose:
 * - Keep the auth pages visually consistent by centralizing header and card styles.
 * - Accepts `title`, `subtitle`, and `children` so pages can inject forms and links.
 *
 * Reasoning:
 * - Small components like this improve maintainability and make the UI easy to test.
 */

const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Card Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthCard
