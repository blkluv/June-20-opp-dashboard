import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App-enhanced.jsx'

console.log('main.jsx is loading enhanced app...')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
