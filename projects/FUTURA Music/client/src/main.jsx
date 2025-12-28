// main.jsx - Application bootstrap
// - Mounts React app, sets up React Router and global AuthProvider
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './state/AuthContext.jsx';

// Root entry point: Initialize routing and auth context
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);