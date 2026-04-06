import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="381427630753-k9ffu51816j7k6qsnc67hkf5q4ute49r.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)