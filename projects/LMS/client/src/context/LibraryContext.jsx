/**
 * LibraryContext - Manages all library operations
 * Handles books, issued books, and library state
 * Later: All operations will call backend APIs
 *
 * NOTE ABOUT MULTI-TAB SYNC:
 * - localStorage is shared ONLY within the same origin (same host + same port).
 * - The "storage" event fires in OTHER tabs, not the same tab that writes.
 */

import React, { createContext, useEffect, useState } from 'react'
import { calculateDueDate } from '../utils/dateUtils'
import { mockBooks } from '../utils/mockBooks'
import {
  addToRecentlyViewed,
  getBooks,
  getIssuedBooks,
  getRecentlyViewed,
  saveBooks,
  saveIssuedBooks,
  addReturnRequest,
  getReturnRequests,
  removeReturnRequestByIssueId
} from '../utils/storageUtils'

export const LibraryContext = createContext()

// localStorage keys (must match storageUtils)
const LS_KEYS = {
  BOOKS: 'library_books',
  ISSUED_BOOKS: 'issued_books',
  RECENTLY_VIEWED: 'recently_viewed',
  RETURN_REQUESTS: 'return_requests'
}

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState([])
  const [issuedBooks, setIssuedBooks] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [returnRequests, setReturnRequests] = useState([]) // ✅ inside component
  const [loading, setLoading] = useState(true)

  // Normalize book data (IDs + copies must be numbers)
  const normalizeBook = (b) => {
    const total = Number(b.totalCopies) || 0
    const availableRaw = Number(b.availableCopies)
    const available = Number.isFinite(availableRaw) ? availableRaw : total

    return {
      ...b,
      id: Number(b.id),
      totalCopies: total,
      availableCopies: available,
      availability: available > 0 // derived
    }
  }

  // Normalize issue records (critical: bookId must be number)
  const normalizeIssue = (ib) => ({
    ...ib,
    bookId: Number(ib.bookId)
  })

  // Reload helpers (source: storage)
  const loadBooksFromStorage = () => getBooks().map(normalizeBook)
  const loadIssuedFromStorage = () => getIssuedBooks().map(normalizeIssue)
  const loadRecentFromStorage = () => getRecentlyViewed()
  const loadReturnRequestsFromStorage = () => getReturnRequests()

  // Initial load
  useEffect(() => {
    const savedBooks = getBooks()
    const savedIssuedBooks = getIssuedBooks()
    const savedRecent = getRecentlyViewed()

    // Return requests
    setReturnRequests(loadReturnRequestsFromStorage())

    // Books init
    if (savedBooks.length === 0) {
      // Start with availableCopies === totalCopies to keep reports consistent
      const normalized = mockBooks.map((b) => {
        const total = Number(b.totalCopies) || 0
        return normalizeBook({ ...b, availableCopies: total })
      })
      setBooks(normalized)
      saveBooks(normalized)
    } else {
      const normalized = savedBooks.map(normalizeBook)
      setBooks(normalized)
      saveBooks(normalized)
    }

    // Issued init
    if (savedIssuedBooks.length > 0) {
      const normalizedIssues = savedIssuedBooks.map(normalizeIssue)
      setIssuedBooks(normalizedIssues)
      saveIssuedBooks(normalizedIssues)
    } else {
      setIssuedBooks([])
    }

    // Recent init
    if (savedRecent.length > 0) {
      setRecentlyViewed(savedRecent)
    } else {
      setRecentlyViewed([])
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Multi-tab live sync (same port only)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return
      if (!e.key) return

      if (e.key === LS_KEYS.BOOKS) {
        setBooks(loadBooksFromStorage())
      }

      if (e.key === LS_KEYS.ISSUED_BOOKS) {
        setIssuedBooks(loadIssuedFromStorage())
      }

      if (e.key === LS_KEYS.RECENTLY_VIEWED) {
        setRecentlyViewed(loadRecentFromStorage())
      }

      if (e.key === LS_KEYS.RETURN_REQUESTS) {
        setReturnRequests(loadReturnRequestsFromStorage())
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Books
  const getAllBooks = () => books

  const searchBooks = (query) => {
    if (!query.trim()) return books
    const q = query.toLowerCase()
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q)
    )
  }

  const filterByCategory = (category) => {
    if (category === 'All') return books
    return books.filter((book) => book.category === category)
  }

  // Details + recently viewed side-effect
  const getBookById = (bookId) => {
    const id = Number(bookId)
    const book = books.find((b) => b.id === id)

    if (book) {
      addToRecentlyViewed(book)
      setRecentlyViewed(getRecentlyViewed())
    }
    return book
  }

  // Issue
  const issueBook = (bookId, userId, days = 7) => {
    const id = Number(bookId)
    const book = books.find((b) => b.id === id)

    if (!book || (book.availableCopies || 0) <= 0) return false

    const issuedBook = {
      id: Math.random().toString(36).substr(2, 9),
      bookId: id,
      userId,
      issueDate: new Date().toISOString(),
      dueDate: calculateDueDate(new Date(), days).toISOString(),
      returnDate: null,
      fine: 0,
      status: 'issued'
    }

    const updatedBooks = books.map((b) => {
      if (b.id === id) {
        const newAvailable = (b.availableCopies || 0) - 1
        return normalizeBook({ ...b, availableCopies: newAvailable })
      }
      return b
    })

    const newIssuedBooks = [...issuedBooks, issuedBook].map(normalizeIssue)

    setBooks(updatedBooks)
    saveBooks(updatedBooks)

    setIssuedBooks(newIssuedBooks)
    saveIssuedBooks(newIssuedBooks)

    return true
  }

  // Return (librarian action)
  const returnBook = (issueRecordId) => {
    const issuedBook = issuedBooks.find((ib) => ib.id === issueRecordId)
    if (!issuedBook) return null

    const dueDate = new Date(issuedBook.dueDate)
    const returnDate = new Date()
    let fine = 0

    if (returnDate > dueDate) {
      const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
      fine = overdueDays * 10
    }

    const updatedIssuedBooks = issuedBooks.map((ib) => {
      if (ib.id === issueRecordId) {
        return {
          ...ib,
          returnDate: returnDate.toISOString(),
          fine,
          status: 'returned'
        }
      }
      return ib
    })

    const updatedBooks = books.map((b) => {
      if (b.id === Number(issuedBook.bookId)) {
        const newAvailable = (b.availableCopies || 0) + 1
        return normalizeBook({ ...b, availableCopies: newAvailable })
      }
      return b
    })

    setBooks(updatedBooks)
    saveBooks(updatedBooks)

    const normalizedIssues = updatedIssuedBooks.map(normalizeIssue)
    setIssuedBooks(normalizedIssues)
    saveIssuedBooks(normalizedIssues)

    return { fine, overdue: fine > 0 }
  }

  // Issued lists
  const getStudentBooks = (userId) => {
    return issuedBooks
      .filter((ib) => ib.userId === userId && ib.status === 'issued')
      .map((ib) => {
        const book = books.find((b) => b.id === Number(ib.bookId))
        if (!book) return null
        return { ...ib, bookId: Number(ib.bookId), bookDetails: book }
      })
      .filter(Boolean)
  }

  const getAllIssuedBooks = () => {
    return issuedBooks
      .filter((ib) => ib.status === 'issued')
      .map((ib) => {
        const book = books.find((b) => b.id === Number(ib.bookId))
        if (!book) return null
        return { ...ib, bookId: Number(ib.bookId), bookDetails: book }
      })
      .filter(Boolean)
  }

  // Admin: books CRUD
  const addBook = (bookData) => {
    if (!bookData.title || !bookData.author) return false
    const total = parseInt(bookData.totalCopies, 10) || 1

    const newBook = normalizeBook({
      id: Math.max(...books.map((b) => b.id), 0) + 1,
      ...bookData,
      totalCopies: total,
      availableCopies: total,
      image: bookData.image || '📖'
    })

    const updatedBooks = [...books, newBook]
    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    return true
  }

  const updateBook = (bookId, updates) => {
    const id = Number(bookId)

    const updatedBooks = books.map((b) => {
      if (b.id !== id) return b
      const merged = { ...b, ...updates }

      merged.totalCopies = Number(merged.totalCopies) || 0

      const providedAvailable = Number(merged.availableCopies)
      merged.availableCopies = Number.isFinite(providedAvailable)
        ? providedAvailable
        : b.availableCopies

      if (merged.availableCopies > merged.totalCopies) merged.availableCopies = merged.totalCopies
      if (merged.availableCopies < 0) merged.availableCopies = 0

      return normalizeBook(merged)
    })

    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    return true
  }

  const deleteBook = (bookId) => {
    const id = Number(bookId)

    const isIssued = issuedBooks.some(
      (ib) => ib.status === 'issued' && Number(ib.bookId) === id
    )
    if (isIssued) return false

    const updatedBooks = books.filter((b) => b.id !== id)
    setBooks(updatedBooks)
    saveBooks(updatedBooks)
    return true
  }

  // ✅ Return Requests
  const requestReturn = (issueId, userId) => {
    const ok = addReturnRequest({ issueId, userId })
    setReturnRequests(getReturnRequests())
    return ok
  }

  const clearReturnRequest = (issueId) => {
    removeReturnRequestByIssueId(issueId)
    setReturnRequests(getReturnRequests())
  }

  const getRecentlyViewedBooks = () => recentlyViewed

  const getStatistics = () => {
    const totalBooks = books.length
    const totalCopies = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0)
    const availableCopies = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0)
    const issuedCopies = totalCopies - availableCopies

    const categories = [...new Set(books.map((b) => b.category))]
    const categoryCount = {}
    categories.forEach((cat) => {
      categoryCount[cat] = books.filter((b) => b.category === cat).length
    })

    const now = new Date()
    const overdueBooks = issuedBooks.filter(
      (ib) => ib.status === 'issued' && new Date(ib.dueDate) < now
    ).length

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCopies,
      activeIssues: issuedBooks.filter((ib) => ib.status === 'issued').length,
      overdueBooks,
      categories,
      categoryCount
    }
  }

  const value = {
    books,
    issuedBooks,
    recentlyViewed,
    returnRequests,
    loading,
    getAllBooks,
    searchBooks,
    filterByCategory,
    getBookById,
    issueBook,
    returnBook,
    getStudentBooks,
    getAllIssuedBooks,
    addBook,
    updateBook,
    deleteBook,
    requestReturn,
    clearReturnRequest,
    getRecentlyViewedBooks,
    getStatistics
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export const useLibrary = () => {
  const context = React.useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used within LibraryProvider')
  return context
}