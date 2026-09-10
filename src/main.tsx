import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/stix-two-text/400.css'
import '@fontsource/stix-two-text/700.css'
import '@fontsource/stix-two-text/400-italic.css'
import '@fontsource/stix-two-text/700-italic.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
