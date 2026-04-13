import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import AppRoutes from './AppRoutes.tsx'
import CookieConsent from './components/CookieConsent.tsx'
import { WishlistProvider } from './context/WishlistContext.tsx'
import { CartProvider } from './context/CartContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="381427630753-k9ffu51816j7k6qsnc67hkf5q4ute49r.apps.googleusercontent.com">
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppRoutes />
            <CookieConsent />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)

