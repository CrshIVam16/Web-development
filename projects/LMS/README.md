# 📚 Smart Library Management System (Frontend)

A modern, feature-rich **Library Management System** built with **React + Vite**.  
This is a **frontend-only (Phase 1)** implementation with mock data stored in **localStorage**, designed to be easily integrated with a backend in **Phase 2**.

---

## 📽️ Project Overview

This app simulates a complete library ecosystem where:

- Students can browse, search, and issue books
- Librarians can manage inventory and track issues/returns
- Everyone can access reports and analytics

All data is currently stored in **localStorage** using mock data, making it suitable for demos and rapid prototyping.

---

## ✨ Key Features

### Authentication
- Login & Signup with role-based access (Student/Librarian)
- Protected routes using a custom `ProtectedRoute`
- Persistent auth state via `localStorage`
- Demo accounts for quick testing

### Book Management
- Browse all books with card layouts
- Real-time search by title/author
- Filter by category
- Book details view
- Availability tracking

### Issue & Return
- Issue books for 7 or 14 days
- Automatic due date calculation
- Fine calculation: ₹10 per overdue day
- Return flow with fine preview
- Librarian transaction management

### Student Dashboard
- View issued books with due dates
- Overdue alerts with fine amounts
- Recently viewed books
- Quick return functionality
- Visual distinction between active vs overdue

### Librarian Dashboard
- Add, edit, delete books
- Real-time statistics
- Category-wise book count
- Monitor issued books
- Issue/return management

### Reports & Analytics
- Library statistics and metrics
- Books by category visualization
- Utilization/occupancy indicators
- Overdue rate analysis
- Insights & recommendations

### UI/UX
- Light/Dark mode (persisted in `localStorage`)
- Fully responsive (mobile/tablet/desktop)
- Smooth transitions
- Accessible forms
- Tailwind CSS styling

---

## 🧰 Tech Stack

- React 18
- Vite
- React Router 6
- Tailwind CSS
- Context API (no Redux)
- localStorage (mock persistence)
- ES6+ JavaScript

---

## 📁 Project Structure

```txt
src/
├── components/
│   ├── Navbar.jsx
│   ├── BookCard.jsx
│   ├── ProtectedRoute.jsx
│   └── Modal.jsx
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Books.jsx
│   ├── StudentDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── IssueReturn.jsx
│   └── Reports.jsx
├── context/
│   ├── AuthContext.jsx
│   └── LibraryContext.jsx
├── utils/
│   ├── mockBooks.js
│   ├── dateUtils.js
│   └── storageUtils.js
├── App.jsx
├── main.jsx
└── index.css
└── ......
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+

### Install & Run
```bash
# 1) Go to project folder
cd "Smart Library Management System"

# 2) Install dependencies
npm install

# 3) Start dev server
npm run dev
```

Open: http://localhost:5173

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🔑 Demo Login Credentials

Student:
- Email: `student@example.com`
- Password: `password123`
- Or use the “Demo Student” button (if available)

Librarian:
- Email: `librarian@example.com`
- Password: `password123`
- Or use the “Demo Librarian” button (if available)

---

## 🏃🏻‍➡️ Quick Usage Flow

### Student Flow
1. Login as student
2. Open “Books” and browse/search
3. Issue an available book (7 or 14 days)
4. Check “My Books” for due dates and status
5. Return the book when done

### Librarian Flow
1. Login as librarian
2. Open Dashboard for statistics
3. Add/Edit/Delete books
4. Manage transactions in “Issue/Return”
5. View analytics in “Reports”

---

## ⚙️ Backend Integration Plan (Phase 2)

This frontend includes clear integration points marked with comments like:

```js
// Later: POST /api/auth/login with JWT
// Later: GET /api/books
// Later: POST /api/books/:id/issue
```

### Suggested Backend Endpoints
- `POST   /api/auth/login`
- `POST   /api/auth/signup`
- `GET    /api/books`
- `POST   /api/books`
- `PUT    /api/books/:id`
- `DELETE /api/books/:id`
- `POST   /api/books/:id/issue`
- `POST   /api/books/:id/return`
- `GET    /api/students/:id/books`
- `GET    /api/issued-books`

---

## 🎢 Customization

### Change Theme Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: '#3b82f6',
  secondary: '#8b5cf6'
}
```

### Add Categories
Edit `src/utils/mockBooks.js`:
```js
export const categories = ['All', 'Fiction', 'Science', 'Technology', 'Your Category']
```

### Modify Fine Rate
Edit `src/utils/dateUtils.js`:
```js
return Math.max(0, overdueDays * 15) // example: ₹15/day instead of ₹10/day
```

---

## ⚠️ Known Limitations (Phase 1)

- No backend: persistence is localStorage-based (demo/prototype)
- Frontend-only auth validation
- Alerts instead of real notifications
- Simple analytics visuals (no chart library)
- Single-device/session behavior (no multi-user sync)

---