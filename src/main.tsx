import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// INI YANG PALING PENTING, JANGAN SAMPAI HILANG:
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)