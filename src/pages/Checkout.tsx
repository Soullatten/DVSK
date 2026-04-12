import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// For mock cart display
import mockImage1 from '../assets/image6.png';
import mockImage2 from '../assets/image3.png';

const CART = [
  { id: 1, name: 'FW26 Tailored Outerwear', variant: 'Obsidian / Medium', price: 850, qty: 1, image: mockImage1 },
  { id: 2, name: 'Silk Noir Draped Dress', variant: 'Onyx / Small', price: 1200, qty: 1, image: mockImage2 }
];

export default function Checkout() {
  const navigate = useNavigate();
  const subtotal = CART.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const [activeStep, setActiveStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [cardNumber, setCardNumber] = useState('');

  const getCardType = (number: string) => {
    const cleanNum = number.replace(/\D/g, '');
    if (cleanNum.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(cleanNum)) return "MASTERCARD";
    if (/^3[47]/.test(cleanNum)) return "AMEX";
    if (/^6(011|5)/.test(cleanNum)) return "DISCOVER";
    return "UNKNOWN";
  };

  // Quick inputs
  const StepLabel = ({ num, title, isActive, isDone }: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", opacity: isActive || isDone ? 1 : 0.3, transition: "opacity 0.3s" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isActive ? "#fff" : "transparent", border: "1px solid #fff", color: isActive ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>
        {isDone ? "✓" : num}
      </div>
      <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: "20px", fontWeight: 300, margin: 0 }}>{title}</h3>
    </div>
  );

  const CustomInput = ({ placeholder, type = "text", width = "100%", value, onChange }: any) => (
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value}
      onChange={onChange}
      className="checkout-input"
      style={{ width, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", color: "#fff", fontFamily: "'Jost', sans-serif", fontSize: "14px", outline: "none", transition: "border-color 0.3s" }}
    />
  );

  return (
    <div style={{ backgroundColor: "#040404", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "40px", left: "40px", zIndex: 100 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          <ArrowLeft size={14} /> Return
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: "row", flexWrap: "wrap", minHeight: "100vh" }}>
        
        {/* Left Side: Order Summary */}
        <div style={{ flex: "1.2", minWidth: "400px", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(40px, 8vw, 120px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 3vw, 3rem)", fontWeight: 300, margin: "0 0 40px 0" }}>Order Review</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>
              {CART.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ width: "80px", height: "100px", background: "#111", overflow: "hidden" }}>
                    <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 400, margin: "0 0 8px 0", letterSpacing: "0.05em" }}>{item.name}</h4>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "0 0 12px 0" }}>{item.variant} &nbsp;—&nbsp; Qty {item.qty}</p>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 300 }}>${(item.price * item.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span>Express Shipping</span>
                <span>Complimentary</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "18px", fontWeight: 400, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                <span>Total Due</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Payment Form */}
        <div style={{ flex: "1.5", minWidth: "400px", padding: "clamp(40px, 8vw, 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} style={{ maxWidth: "540px" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "60px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              <Lock size={14} /> Secure Encrypted Checkout
            </div>

            {/* Email Step */}
            <div style={{ marginBottom: "50px" }}>
              <StepLabel num="1" title="Contact Information" isActive={activeStep === 1} isDone={activeStep > 1} />
              {activeStep === 1 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <CustomInput placeholder="Email Address" type="email" />
                  <button onClick={() => setActiveStep(2)} className="chk-btn" style={{ marginTop: "20px", width: "100%", padding: "18px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}>
                    Continue to Shipping
                  </button>
                </motion.div>
              )}
            </div>

            {/* Shipping Step */}
            <div style={{ marginBottom: "50px" }}>
              <StepLabel num="2" title="Shipping Address" isActive={activeStep === 2} isDone={activeStep > 2} />
              {activeStep === 2 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <CustomInput placeholder="First Name" />
                    <CustomInput placeholder="Last Name" />
                  </div>
                  <CustomInput placeholder="Street Address" />
                  <div style={{ display: "flex", gap: "16px" }}>
                    <CustomInput placeholder="City" />
                    <CustomInput placeholder="Postal Code" />
                  </div>
                  <button onClick={() => setActiveStep(3)} className="chk-btn" style={{ marginTop: "10px", width: "100%", padding: "18px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}>
                    Continue to Payment
                  </button>
                </motion.div>
              )}
            </div>

            {/* Payment Step */}
            <div>
               <StepLabel num="3" title="Payment Details" isActive={activeStep === 3} isDone={activeStep > 3} />
               {activeStep === 3 && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "24px" }}>
                      
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px" }}>
                        {['credit', 'debit', 'netbanking', 'upi'].map(method => (
                          <button 
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            style={{ 
                              padding: "10px 16px", background: paymentMethod === method ? "#fff" : "transparent",
                              color: paymentMethod === method ? "#000" : "rgba(255,255,255,0.5)",
                              border: `1px solid ${paymentMethod === method ? "#fff" : "rgba(255,255,255,0.2)"}`,
                              fontFamily: "'Jost', sans-serif", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em",
                              cursor: "pointer", transition: "all 0.3s ease" 
                            }}>
                            {method.replace('netbanking', 'Net Banking')}
                          </button>
                        ))}
                      </div>

                      {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ position: "relative" }}>
                            <CustomInput 
                              placeholder="Card Number" 
                              value={cardNumber} 
                              onChange={(e: any) => setCardNumber(e.target.value)} 
                            />
                            {cardNumber.length > 0 && getCardType(cardNumber) !== "UNKNOWN" && (
                              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "#fff", color: "#000", padding: "4px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>
                                {getCardType(cardNumber)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "16px" }}>
                            <CustomInput placeholder="MM/YY" />
                            <CustomInput placeholder="CVC" />
                          </div>
                          <CustomInput placeholder="Name on Card" />
                        </div>
                      )}

                      {paymentMethod === 'upi' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <CustomInput placeholder="Enter UPI ID (e.g. name@bank)" />
                          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>A request will be sent to your UPI app for authorization.</p>
                        </div>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <select style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", color: "rgba(255,255,255,0.4)", fontFamily: "'Jost', sans-serif", fontSize: "14px", outline: "none", appearance: "none" }}>
                            <option>Select your Bank</option>
                            <option>HDFC Bank</option>
                            <option>SBI</option>
                            <option>ICICI Bank</option>
                            <option>Axis Bank</option>
                          </select>
                        </div>
                      )}

                    </div>
                    
                    <button className="chk-btn" style={{ width: "100%", padding: "20px", background: "#000", color: "#fff", border: "1px solid #fff", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "12px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.3s" }}>
                      AUTHORIZE ${(subtotal).toLocaleString()}
                    </button>
                 </motion.div>
               )}
            </div>

          </motion.div>
        </div>
      </div>
      
      <Footer />

      <style>{`
        .checkout-input:focus {
          border-color: #fff !important;
          background: rgba(255,255,255,0.05) !important;
        }
        .chk-btn:hover {
          transform: scale(0.98);
        }
        
        @media (max-width: 900px) {
          .chk-btn:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
