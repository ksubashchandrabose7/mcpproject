import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      style: { background: '#1e2a3a', color: '#e2e8f0', border: '1px solid #2d3f55' },
      duration: 3000,
    }} />
  </React.StrictMode>
)
