import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Entry point - renders the React application into the #root element.
// We intentionally keep this file minimal. The app composition (providers,
// routing) is handled inside `App.jsx` to keep the root bootstrap simple.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
