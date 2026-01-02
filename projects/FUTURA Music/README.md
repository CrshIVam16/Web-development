# FUTURA Music 🎵  
**A Mini Spotify-like MERN Music Streaming Web App**

FUTURA Music is a full‑stack **MERN** project inspired by modern music platforms. Users can **sign up / log in**, **discover and play songs**, **upload local MP3 files**, **manage playlists**, and use a **Spotify-like bottom player**. It also supports **external preview tracks** using **Deezer (primary)** and **iTunes (fallback)**.

---

## ✨ Key Features

### 🔐 Authentication (JWT)
- Signup / Login (JWT-based)
- Password hashing using `bcryptjs`
- Protected APIs using JWT middleware
- Protected pages using React Router + `ProtectedRoute`

### 🎶 Songs (Local + External)
**Local songs**
- Upload MP3 to server
- List & search songs stored in MongoDB
- Download uploaded MP3 files

**External songs (preview-based)**
- Search from Deezer API
- Fallback to iTunes Search API
- Download external preview clips (format depends on provider)

### 📂 Playlists
- Create playlists
- Add/remove songs (supports both local and external songs)
- Play all songs in a playlist
- Playlist stores songs as embedded objects for quick playback

### ▶️ Player
- Play/Pause, Next/Prev (queue-based)
- Seek/progress tracking
- Volume control (saved in localStorage)

### 🕒 Recently Played (User-specific)
- History stored per-user in localStorage:
  - `recentlyPlayed:<userId/email>`
- Desktop sidebar + Mobile drawer UI

### 📱 Responsive UI
- Mobile-friendly navbar and player layout
- Desktop layout includes a sidebar for Recently Played
- Mobile layout uses a drawer/button for Recently Played

---

## 🧰 Tech Stack

### Frontend
- React (Vite)
- React Router
- Tailwind CSS
- `fetch` API wrapper (`client/src/utils/api.js`)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Multer (MP3 uploads)
- Axios (Deezer/iTunes API calls)
- Morgan + CORS

---

## 📁 Project Structure

```
FUTURA-MUSIC/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── state/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── ...
└── server/
    ├── config/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── uploads/
    ├── index.js
    ├── package.json
    └── ...
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Local Songs
- `GET /api/songs?q=`
- `POST /api/songs/upload`
- `GET /api/songs/:id/download`

### External Songs (Preview-Based)
- `GET /api/external-songs?q=`
- `GET /api/external-songs/:externalId/download`  
  `externalId` format: `deezer:<id>` or `itunes:<id>`

### Playlists
- `GET /api/playlists`
- `POST /api/playlists`
- `POST /api/playlists/:id/add`
- `POST /api/playlists/:id/remove`

---

## 🗃️ Database Models

### User
- `name`
- `email` (unique)
- `passwordHash`
- timestamps (`createdAt`, `updatedAt`)

### Song
- `title`
- `artist`
- `filename`
- `owner` (ref `User`, optional)
- timestamps

### Playlist
- `name`
- `user` (ref `User`, required)
- `songs[]` embedded objects (supports local + external)
  - `_id` stored as **String** to support:
    - local Mongo song ids (as strings)
    - external ids like `deezer:<id>` / `itunes:<id>`
  - `title`, `artist`, `filePath`, `coverPath`, `external`
- timestamps

---

## 🧠 Local Storage Usage (Frontend)

- `token` – JWT token
- `user` – logged-in user object
- `favorites` – saved song IDs (device-based)
- `recentlyPlayed:<userId/email>` – user-specific history
- `vol` – player volume

---

## ⚙️ Environment Setup

### Backend (`server/.env`)
```env
MONGO_URL=mongodb://127.0.0.1:27017/mern-music
JWT_SECRET=your_secret_here
PORT=5000
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Installation & Run

### 1) Backend
```bash
cd server
npm install
npm start
```

### 2) Frontend
```bash
cd client
npm install
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## ⚠️ Known Limitations
- External songs are **preview clips only**
- Recently Played and Favorites are stored locally (not synced)
- No admin dashboard
- No pagination for large datasets

---

## 🛣️ Future Enhancements
- Store Recently Played in MongoDB
- Add “Save to Playlist” inside player
- Toast notifications
- Infinite scroll & pagination
- Admin panel
- Refresh tokens & rate limiting