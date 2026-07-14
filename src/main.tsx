import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initPwaUpdater } from './utils/pwa-updater'
import { isTauriRuntime } from './services/runtime-environment'
import { initializeWorkspaceRegistry } from './services/workspace-service'

// Register PWA service worker for offline support and in-app updates
async function startMuse() {
  if (isTauriRuntime()) await initializeWorkspaceRegistry()
  else initPwaUpdater()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void startMuse()
