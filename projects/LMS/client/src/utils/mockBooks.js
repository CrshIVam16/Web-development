/**
 * Mock Books Database
 * Contains sample library data
 * Later: Will be replaced with API calls to GET /api/books
 *
 * NOTE:
 * - We do NOT store "availability" as a separate source of truth.
 * - Availability should be derived from: availableCopies > 0
 */

export const mockBooks = [
  {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Fiction',
    isbn: '978-0-7432-7356-5',
    totalCopies: 3,
    availableCopies: 3,
    publishedYear: 1925,
    description: 'A classic American novel about wealth, love, and the American Dream.',
    image: '📖'
  },
  {
    id: 2,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Fiction',
    isbn: '978-0-06-112008-4',
    totalCopies: 4,
    availableCopies: 4,
    publishedYear: 1960,
    description: 'A gripping tale of racial injustice and childhood innocence.',
    image: '📚'
  },
  {
    id: 3,
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science',
    isbn: '978-0-553-38016-3',
    totalCopies: 2,
    availableCopies: 2,
    publishedYear: 1988,
    description: 'An exploration of time, space, and the universe.',
    image: '🔬'
  },
  {
    id: 4,
    title: 'Python Crash Course',
    author: 'Eric Matthes',
    category: 'Technology',
    isbn: '978-1-59327-928-8',
    totalCopies: 5,
    availableCopies: 5,
    publishedYear: 2019,
    description: 'Learn Python programming from basics to advanced concepts.',
    image: '💻'
  },
  {
    id: 5,
    title: '1984',
    author: 'George Orwell',
    category: 'Fiction',
    isbn: '978-0-452-26423-9',
    totalCopies: 3,
    availableCopies: 3,
    publishedYear: 1949,
    description: 'A dystopian novel exploring themes of totalitarianism.',
    image: '📖'
  },
  {
    id: 6,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Help',
    isbn: '978-0735211292',
    totalCopies: 6,
    availableCopies: 6,
    publishedYear: 2018,
    description: 'Build good habits and break bad ones with tiny changes.',
    image: '⭐'
  },
  {
    id: 7,
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    category: 'Fiction',
    isbn: '978-0-316-76948-0',
    totalCopies: 2,
    availableCopies: 2,
    publishedYear: 1951,
    description: 'A controversial coming-of-age story.',
    image: '📖'
  },
  {
    id: 8,
    title: 'Design Patterns',
    author: 'Gang of Four',
    category: 'Technology',
    isbn: '978-0-201-63361-0',
    totalCopies: 3,
    availableCopies: 3,
    publishedYear: 1994,
    description: 'Essential patterns for building scalable software.',
    image: '💻'
  }
]

// Categories for filtering
export const categories = ['All', 'Fiction', 'Science', 'Technology', 'Self-Help']