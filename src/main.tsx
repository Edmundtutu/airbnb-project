import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './core/App'
import CommingSoonPage from './core/CommingSoonApp.tsx'
import './styles/index.css'

const showCommingSoon = import.meta.env.VITE_SHOW_COMMING_SOON === true;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {showCommingSoon ? <CommingSoonPage /> : <App />}
  </React.StrictMode>,
)
