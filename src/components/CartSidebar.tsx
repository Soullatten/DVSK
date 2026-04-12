import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ArrowRight, Trash2 } from 'lucide-react';

import mockImage1 from '../assets/image6.png';
import mockImage2 from '../assets/image3.png';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_CART = [
  {
    id: 1,
    name: 'FW26 Tailored Outerwear',
    variant: 'Obsidian / Medium',
    price: 850,
    qty: 1,
    image: mockImage1,
  },
  {
    id: 2,
    name: 'Silk Noir Draped Dress',
    variant: 'Onyx / Small',
    price: 1200,
    qty: 1,
    image: mockImage2,
  }
];

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(INITIAL_CART);

  // Restore cart specifically for demonstration if it was emptied
  useEffect(() => {
    if (isOpen && cartItems.length === 0) {
      setCartItems(INITIAL_CART);
    }
  }, [isOpen]);

  const handleIncrement = (id: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const handleDecrement = (id: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id && item.qty > 1) {
        return { ...item, qty: item.qty - 1 };
      }
      return item;
    }));
  };

  const handleRemove = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const FREE_SHIPPING_THRESHOLD = 2500;
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountLeft = FREE_SHIPPING_THRESHOLD - subtotal;

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
               background: 'rgba(2,2,2,0.4)',
               zIndex: 999998,
             }}
           />

           {/* Sidebar Drawer */}
           <motion.div
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
               background: '#080808',
               borderLeft: '1px solid rgba(255,255,255,0.04)',
               zIndex: 999999,
               display: 'flex',
               flexDirection: 'column',
               boxShadow: '-30px 0 80px rgba(0,0,0,0.8)',
             }}
           >
              {/* Header Container */}
              <div style={{ padding: '48px 48px 24px 48px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                     <h2 style={{ 
                       fontFamily: "'Cormorant Garamond', serif", 
                       fontSize: '36px', 
                       color: '#fff', 
                       margin: 0, 
                       fontWeight: 300,
                       letterSpacing: '-0.02em',
                       lineHeight: 1
                     }}>
                       Cart
                     </h2>
                     <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#ffebab', opacity: 0.8 }}>
                       ({cartItems.length})
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

                 {/* Progressive Shipping Tracker */}
                 <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px' }}>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#fff', margin: '0 0 12px 0', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                       {amountLeft > 0 ? (
                         <span>You are <span style={{ color: '#ffebab' }}>${amountLeft.toLocaleString()}</span> away from Free Worldwide Shipping.</span>
                       ) : (
                         <span style={{ color: '#ffebab' }}>You have unlocked Free Worldwide Shipping!</span>
                       )}
                    </p>
                    <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progressPercent}%` }}
                         transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                         style={{ height: '100%', background: '#ffebab' }}
                       />
                    </div>
                 </div>
              </div>

              {/* Scrollable Items Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 48px', position: 'relative' }}>
                 <AnimatePresence>
                   {cartItems.length === 0 && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       style={{ textAlign: 'center', paddingTop: '80px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Jost', sans-serif" }}
                     >
                        <p>Your cart is empty.</p>
                     </motion.div>
                   )}
                   {cartItems.map((item, i) => (
                     <motion.div 
                       key={item.id} 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, x: -20, transition: { duration: 0.3 } }}
                       transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                       style={{ display: 'flex', gap: '24px', marginBottom: '32px', position: 'relative' }}
                     >
                        {/* Product Image */}
                        <div style={{ width: '110px', height: '140px', background: '#111', flexShrink: 0, borderRadius: '2px', overflow: 'hidden' }}>
                           <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        {/* Product Details & Controls */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
                           <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#fff', margin: '0 0 6px 0', fontWeight: 400, letterSpacing: '0.05em' }}>
                                 {item.name}
                               </h3>
                               <button 
                                 onClick={() => handleRemove(item.id)}
                                 style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, transition: 'color 0.3s ease' }}
                                 onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4d'}
                                 onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                               >
                                 <Trash2 size={16} strokeWidth={1.5} />
                               </button>
                             </div>
                             <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
                               {item.variant}
                             </p>
                           </div>
                           
                           {/* Price and Qty */}
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '30px', padding: '2px 6px' }}>
                                 <button 
                                   onClick={() => handleDecrement(item.id)}
                                   style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer', opacity: item.qty <= 1 ? 0.3 : 1 }}
                                   disabled={item.qty <= 1}
                                 >
                                   <Minus size={12} />
                                 </button>
                                 <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#fff', width: '20px', textAlign: 'center' }}>
                                   {item.qty}
                                 </span>
                                 <button 
                                   onClick={() => handleIncrement(item.id)}
                                   style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
                                 >
                                   <Plus size={12} />
                                 </button>
                              </div>
                              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#fff', fontWeight: 300, letterSpacing: '0.05em' }}>
                                ${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
              </div>

              {/* Fixed Footer */}
              <div style={{ 
                padding: '32px 48px', 
                background: 'linear-gradient(to top, #080808 80%, rgba(8,8,8,0) 100%)',
                marginTop: 'auto',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                   <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subtotal</span>
                   <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: '#ffebab', lineHeight: 1 }}>
                     ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </span>
                 </div>
                 
                 <button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => navigate('/checkout'), 300);
                  }}
                  style={{
                   width: '100%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '12px',
                   padding: '22px',
                   background: '#ffffff',
                   color: '#080808',
                   border: 'none',
                   fontFamily: "'Jost', sans-serif",
                   fontSize: '13px',
                   fontWeight: 500,
                   letterSpacing: '0.2em',
                   textTransform: 'uppercase',
                   cursor: 'pointer',
                   transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                   position: 'relative',
                   overflow: 'hidden'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = '#ffebab';
                   e.currentTarget.style.transform = 'scale(0.98)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = '#ffffff';
                   e.currentTarget.style.transform = 'scale(1)';
                 }}
                 >
                   <span>Proceed to Checkout</span>
                   <ArrowRight size={16} strokeWidth={1.5} />
                 </button>
                 
                 <p style={{ textAlign: 'center', fontFamily: "'Jost', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '20px', letterSpacing: '0.05em' }}>
                   Taxes, shipping and discounts codes calculated at checkout.
                 </p>
              </div>
           </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  ) : null;
}
