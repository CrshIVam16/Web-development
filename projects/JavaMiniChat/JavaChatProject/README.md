# 🗨️ JavaMiniChat (ChitChat)

A mini WhatsApp-style chat application built with **Java Swing**, **Socket programming**, and **MongoDB** (server-side only).  
It demonstrates real-time messaging, client–server architecture, and MongoDB integration in a clean, beginner-friendly way.

---

## Features

- Signup + Login
- Broadcast room (all users)
- Private chat (1:1)
- Group chat
- Typing indicator (private chat)
- Online status indicator (green dot)
- WhatsApp-like message bubbles (sent/right, received/left)
- Date separators (TODAY / YESTERDAY / date)
- Select messages → Delete selected (for me)
  - Persists on the same PC after relogin (local-only)
- Clear entire current chat (for me)
  - Persists after relogin (server stores a clear marker)
- Logout

---

## Architecture

- **Client:** Java Swing desktop application  
  Communicates with the server using a **JSON-per-line** socket protocol.
- **Server:** Java socket server  
  Handles authentication, message routing, and all database operations.
- **Database:** MongoDB (**server-side only**)  
  Clients never connect to MongoDB directly.

---

## Project Structure

```
JavaMiniChatProject/
├── lib/                    # External JAR dependencies (MongoDB, Gson, etc.)
├── bin/                    # Compiled .class files (build output)
├── src/
│   ├── app/                # Application entry points
│   ├── common/             # Shared utilities and models
│   ├── client/             # Client-side logic      
│   └── server/             # Server-side logic     # MongoDB connection & manager
├── .gitignore              # Git ignored files
└── README.md               # Project documentation
```

---

## Requirements

- Java **JDK 17+**
- MongoDB running locally (default: `mongodb://localhost:27017`)
- Required JARs inside `lib/`:
  - `mongodb-driver-sync-5.2.0.jar`
  - `mongodb-driver-core-5.2.0.jar`
  - `bson-5.2.0.jar`
  - `gson-2.11.0.jar`

---

## MongoDB Setup

Check if MongoDB is running:

```powershell
mongosh
```

If it connects successfully, MongoDB is running. Type `exit` to quit.

Collections used by the server (auto-created):
- `users`
- `broadcast_messages`
- `private_messages`
- `groups`
- `group_messages`
- `chat_clears`

---

## Build and Run (Windows PowerShell)

### 1) Compile

From the project root:

```powershell
mkdir bin -Force
$files = Get-ChildItem .\src -Recurse -Filter *.java | ForEach-Object { $_.FullName }
javac -encoding UTF-8 -cp ".\lib\*" -d .\bin $files
```

### 2) Run the server

Open one PowerShell window:

```powershell
java -cp ".\bin;.\lib\*" app.ServerMain
```

### 3) Run the client

Open another PowerShell window:

```powershell
java -cp ".\bin;.\lib\*" app.ClientMain
```

### Dev Mode (server + one client together)

```powershell
java -cp ".\bin;.\lib\*" app.Main
```

---

## Environment Variables (Optional)

### Server
- `CHAT_MONGO_URI` (default: `mongodb://localhost:27017`)
- `CHAT_DB_NAME` (default: `chatdb`)
- `CHAT_PORT` (default: `9999`)

Example:
```powershell
$env:CHAT_MONGO_URI="mongodb://localhost:27017"
$env:CHAT_DB_NAME="chatdb"
$env:CHAT_PORT="9999"
java -cp ".\bin;.\lib\*" app.ServerMain
```

### Client
- `CHAT_HOST` (default: `localhost`)
- `CHAT_PORT` (default: `9999`)

Example:
```powershell
$env:CHAT_HOST="localhost"
$env:CHAT_PORT="9999"
java -cp ".\bin;.\lib\*" app.ClientMain
```

---

## Notes (Important Behavior)

- **Protocol:** one JSON object per line over TCP sockets.
- **Delete selected messages (for me):** persists locally on this PC only  
  (does not delete from MongoDB; other users still see the messages).
- **Clear entire current chat (for me):** stored as a per-user clear marker in MongoDB  
  (does not delete messages from MongoDB; other users still see full history).

---

## Security & Privacy

This project is safe to share, but **do not commit personal data**.

### Do NOT upload
- `bin/` (compiled output)
- `.env` / `.env.*` (if you create any)
- passwords, tokens, API keys
- TLS keys/certificates (`*.pem`, `*.key`, `*.p12`, `*.jks`)
- database dumps or local DB folders (`data/`, `dump/`, `*.sqlite`, etc.)
- any exported chat logs

### Safe to upload
- `src/`
- `README.md`
- `lib/*.jar` (included so others can clone and run without downloading dependencies)

### Notes
- MongoDB runs locally by default (`mongodb://localhost:27017`).
- “Delete selected messages (for me)” is stored **locally on the user’s PC** (not in MongoDB).
- “Clear entire current chat (for me)” stores only a timestamp marker in MongoDB (messages remain in DB).

---

## VS Code: Fix JAR “red underlines”

If VS Code doesn’t detect the JARs, create:

`JavaChatProject/.vscode/settings.json`

```json
{
  "java.project.referencedLibraries": [
    "lib/**/*.jar"
  ]
}
```

Then:
1. Open Command Palette
2. Run **Java: Clean Java Language Server Workspace**
3. Reload VS Code

---

## Common Issue

### Port already in use
If port `9999` is busy:
- Stop the previous server, or
- Change `CHAT_PORT` and run again.

---