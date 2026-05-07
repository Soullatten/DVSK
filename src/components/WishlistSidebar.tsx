import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Trash2, ShoppingBag } from 'lucide-react';

import { useWishlist } from '../context/WishlistContext';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistSidebar({ isOpen, onClose }: WishlistSidebarProps) {
  const { items: wishlistItems, removeItem } = useWishlist();

  const handleMoveToCart = (id: number) => {
    // In a real app, dispatch to Cart context
    removeItem(id);
  };

  return typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Deep Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,2,2,0.6)',
              zIndex: 999998,
            }}
          />

          {/* Sidebar Drawer */}
          <motion.div
            className="dvsk-wishlist-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '520px',
              background: '#040404', // Darker to contrast with cart
              borderLeft: '1px solid rgba(139, 43, 226, 0.2)', // Purple tint line
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-30px 0 100px rgba(78, 0, 166, 0.15)',
            }}
          >
            {/* Header Container */}
            <div style={{ padding: '48px 48px 24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '36px',
                    color: '#fff',
                    margin: 0,
                    fontWeight: 300,
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                    textTransform: 'uppercase'
                  }}>
                    The Vault
                  </h2>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#8B2BE2', letterSpacing: '0.2em' }}>
                       // {wishlistItems.length} SAVED
                  </span>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', opacity: 0.6, transition: 'opacity 0.3s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  <X strokeWidth={1.5} size={28} />
                </button>
              </div>
            </div>

            {/* Scrollable Items Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', position: 'relative' }}>
              <AnimatePresence>
                {wishlistItems.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ textAlign: 'center', paddingTop: '80px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Jost', sans-serif", fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >
                    <p>No items archived.</p>
                  </motion.div>
                )}
                {wishlistItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                    style={{ display: 'flex', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {/* Product Image */}
                    <div style={{ width: '130px', height: '170px', background: '#111', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(50%)' }} />
                    </div>

                    {/* Product Details & Controls */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', color: '#fff', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, transition: 'color 0.3s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4d'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          {item.variant}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#fff', fontWeight: 300 }}>
                          ${(item.price).toLocaleString('en-US')}
                        </span>

                        <button
                          onClick={() => handleMoveToCart(item.id)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 15px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', transition: 'all 0.3s', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Jost', sans-serif" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                        >
                          <ShoppingBag size={12} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <style>{`
              @media (max-width: 640px) {
                .dvsk-wishlist-drawer { max-width: 100% !important; }
                .dvsk-wishlist-drawer > div:first-child { padding: 24px 20px 16px !important; }
                .dvsk-wishlist-drawer > div:first-child h2 { font-size: 28px !important; }
                .dvsk-wishlist-drawer > div:nth-child(2) { padding: 24px 20px !important; }
                .dvsk-wishlist-drawer > div:nth-child(2) > div > div > div:first-child {
                  width: 100px !important;
                  height: 132px !important;
                }
              }
              @media (max-width: 380px) {
                .dvsk-wishlist-drawer > div:first-child h2 { font-size: 24px !important; }
                .dvsk-wishlist-drawer > div:first-child { padding: 20px 16px 14px !important; }
                .dvsk-wishlist-drawer > div:nth-child(2) { padding: 20px 16px !important; }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  ) : null;
}
