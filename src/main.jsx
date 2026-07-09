import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   /* CSS Global harus di atas */
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)