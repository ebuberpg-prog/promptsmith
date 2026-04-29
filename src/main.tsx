import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initPwaUpdater } from './utils/pwa-updater'

// Register PWA service worker for offline support and in-app updates
initPwaUpdater()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
