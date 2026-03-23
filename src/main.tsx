import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ACTIVE_THEME } from './config/themeConfig'
import './styles/theme.css'
import './index.css'
import App from './App.tsx'

// Apply the active theme to the html element
document.documentElement.setAttribute('data-theme', ACTIVE_THEME);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
