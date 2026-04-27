import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Register PWA service worker for offline support
registerSW({
  onNeedRefresh() {
    if (confirm('A new version of PromptSmith is available. Reload to update?')) {
      location.reload()
    }
  },
  onOfflineReady() {
    console.log('PromptSmith is ready for offline use')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
