import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('dvsk_cookie_consent');
    if (!consent) {
      // Small delay to let the site load and feel premium before asking for cookies
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('dvsk_cookie_consent', 'accepted');
    setIsVisible(false);
    // Future: Initialize Analytics / Tracking Scripts Here
  };

  const handleDecline = () => {
    localStorage.setItem('dvsk_cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0, transition: { duration: 0.5, ease: "easeIn" } }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            position: 'fixed',
            bottom: 'clamp(20px, 4vw, 40px)',
            right: 'clamp(20px, 4vw, 40px)',
            zIndex: 99999,
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: '2px solid #ffebab',
            padding: '28px 32px',
            maxWidth: '380px',
            borderRadius: '2px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <h3 style={{ 
              fontFamily: "'Cormorant Garamond', serif", 
              fontSize: '26px', 
              color: '#ffffff', 
              margin: '0 0 10px 0',
              fontWeight: 400,
              lineHeight: 1.1
            }}>
              We value your privacy
            </h3>
            <p style={{ 
              fontFamily: "'Jost', sans-serif", 
              fontSize: '13px', 
              color: 'rgba(255,255,255,0.6)', 
              margin: 0,
              lineHeight: 1.6,
              fontWeight: 300
            }}>
              We use strictly necessary cookies to make our site work. We'd also like to set optional analytics cookies to track active users and help us improve your experience.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleAccept}
              style={{
                background: '#ffffff',
                color: '#080808',
                border: 'none',
                padding: '12px 24px',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '2px',
                flex: 1,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e6d39a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              Accept All
            </button>
            <button 
              onClick={handleDecline}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '12px 24px',
                fontFamily: "'Jost', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '2px',
                flex: 1,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
