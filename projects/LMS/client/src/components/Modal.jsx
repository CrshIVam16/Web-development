/**
 * Modal - Reusable modal/dialog component
 * Used for confirmations, forms, and other modal content
 */

import { useEffect } from 'react'

const Modal = ({ isOpen, title, children, onClose, actions = [] }) => {
  if (!isOpen) return null

  // Close on Escape key (simple UX)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    // Click backdrop to close
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      {/* Stop click inside modal from closing */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={() => onClose?.()}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              aria-label="Close modal"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="border-t dark:border-gray-700 px-6 py-4 flex gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                type="button"
                className={`flex-1 py-2 rounded font-medium transition ${action.variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : action.variant === 'secondary'
                      ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-primary hover:bg-blue-600 text-white'
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal