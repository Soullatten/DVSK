import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import App from './App.tsx'
import Home from './pages/Home.tsx'
import About from './pages/About.tsx'
import Account from './pages/Account.tsx'
import Menswear from './pages/Menswear.tsx'
import Womenswear from './pages/Womenswear.tsx'
import ProductDetail from './pages/ProductDetail.tsx'
import Checkout from './pages/Checkout.tsx'
import PageWrapper from './components/PageWrapper.tsx'

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><App /></PageWrapper>} />
        <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/account" element={<PageWrapper><Account /></PageWrapper>} />
        <Route path="/men" element={<PageWrapper><Menswear /></PageWrapper>} />
        <Route path="/women" element={<PageWrapper><Womenswear /></PageWrapper>} />
        <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}
