import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './core/App'
import './styles/index.css'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch(console.error);
  });
}

// Setup install prompt listener
setupInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
