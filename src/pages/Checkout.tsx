import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { ordersApi } from "../api/orders";

import fallbackImage from '../assets/image6.png';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 149;
const TAX_RATE = 0.18;

const StepLabel = ({ num, title, isActive, isDone }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", opacity: isActive || isDone ? 1 : 0.3, transition: "opacity 0.3s" }}>
    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isActive ? "#fff" : isDone ? "#22c55e" : "transparent", border: `1px solid ${isDone ? '#22c55e' : '#fff'}`, color: isActive ? "#000" : isDone ? "#fff" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>
      {isDone ? "✓" : num}
    </div>
    <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: "20px", fontWeight: 300, margin: 0 }}>{title}</h3>
  </div>
);

const CustomInput = ({ placeholder, type = "text", width = "100%", value, onChange, required = false }: any) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    className="checkout-input"
    style={{ width, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", color: "#fff", fontFamily: "'Jost', sans-serif", fontSize: "14px", outline: "none", transition: "border-color 0.3s" }}
  />
);

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems, subtotal, clearCart, itemCount } = useCart();
  const [activeStep, setActiveStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  // Computed totals
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxableAmount = subtotal;
  const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!email || !firstName || !lastName || !address || !city || !pincode || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      // Step 1: Create order in backend (which creates from cart)
      // First we need an address ID — for now we pass address data
      // The backend expects an addressId, so we need to create address first
      // For simplicity, we'll create a simplified flow

      const token = localStorage.getItem('dvsk_auth_token');

      if (token) {
        // Full backend flow: create order -> create Razorpay order -> open modal -> verify
        const order = await ordersApi.createOrder(
          "temp-address", // In production, you'd create/select address first
          undefined,
          `${firstName} ${lastName}, ${address}, ${city}, ${state} ${pincode}`
        );

        const paymentData = await ordersApi.createPayment(order.id);

        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: "DVSK CLO",
          description: `Order ${order.orderNumber}`,
          order_id: paymentData.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await ordersApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setOrderNumber(order.orderNumber);
              setOrderComplete(true);
              await clearCart();
            } catch (verifyErr: any) {
              setError("Payment verification failed. Please contact support.");
            }
            setProcessing(false);
          },
          prefill: {
            name: `${firstName} ${lastName}`,
            email: email,
            contact: phone,
          },
          theme: { color: "#080808" },
          modal: {
            ondismiss: () => {
              setProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setError(`Payment failed: ${response.error.description}`);
          setProcessing(false);
        });
        rzp.open();
      } else {
        // No auth — simulate Razorpay modal (test mode demo)
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error("Failed to load Razorpay.");

        const options = {
          key: "rzp_test_placeholder", // Replace with actual test key
          amount: Math.round(total * 100),
          currency: "INR",
          name: "DVSK CLO",
          description: "DVSK Order",
          handler: async () => {
            setOrderNumber(`DVSK-${Date.now()}`);
            setOrderComplete(true);
            await clearCart();
            setProcessing(false);
          },
          prefill: {
            name: `${firstName} ${lastName}`,
            email: email,
            contact: phone,
          },
          theme: { color: "#080808" },
          modal: {
            ondismiss: () => setProcessing(false),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  // Order complete view
  if (orderComplete) {
    return (
      <div style={{ backgroundColor: "#040404", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", maxWidth: "500px", padding: "40px" }}
        >
          <CheckCircle size={64} color="#22c55e" style={{ margin: "0 auto 30px" }} />
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "3rem", fontWeight: 300, margin: "0 0 16px" }}>
            Order Confirmed
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "8px" }}>
            Thank you for your purchase.
          </p>
          <p style={{ color: "#ffebab", fontSize: "13px", letterSpacing: "0.15em", marginBottom: "40px" }}>
            ORDER #{orderNumber}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: 1.6, marginBottom: "40px" }}>
            A confirmation email will be sent to {email}. You can track your order status from your account.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ padding: "18px 48px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}
            className="chk-btn"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  // Empty cart view
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <div style={{ backgroundColor: "#040404", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <Navbar />
        <p style={{ fontSize: "14px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>Your cart is empty.</p>
        <button onClick={() => navigate('/men')} style={{ padding: "14px 36px", background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase" }}>
          BROWSE COLLECTION
        </button>
      </div>
    );
  }

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

        {/* Left Side: Order Summary from real cart */}
        <div style={{ flex: "1.2", minWidth: "400px", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(40px, 8vw, 120px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 3vw, 3rem)", fontWeight: 300, margin: "0 0 40px 0" }}>
              Order Review
              <span style={{ fontSize: "14px", fontFamily: "'Jost', sans-serif", fontStyle: "normal", color: "rgba(255,255,255,0.4)", marginLeft: "12px" }}>({itemCount} items)</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px", maxHeight: "400px", overflowY: "auto" }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ width: "80px", height: "100px", background: "#111", overflow: "hidden", flexShrink: 0 }}>
                    <img
                      src={item.image || fallbackImage}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 400, margin: "0 0 8px 0", letterSpacing: "0.05em" }}>{item.name}</h4>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "0 0 12px 0" }}>{item.variant} &nbsp;—&nbsp; Qty {item.qty}</p>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 300, whiteSpace: "nowrap" }}>₹{(item.price * item.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? "#22c55e" : "rgba(255,255,255,0.5)" }}>
                  {shipping === 0 ? "Free" : `₹${shipping}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                <span>GST (18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "18px", fontWeight: 400, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                <span>Total Due</span>
                <span style={{ color: "#ffebab" }}>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Checkout Form */}
        <div style={{ flex: "1.5", minWidth: "400px", padding: "clamp(40px, 8vw, 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} style={{ maxWidth: "540px" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "60px", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              <Lock size={14} /> Secure Encrypted Checkout
            </div>

            {error && (
              <div style={{ padding: "16px", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", marginBottom: "30px", fontSize: "13px", color: "#ff4d4d" }}>
                {error}
              </div>
            )}

            {/* Step 1: Contact */}
            <div style={{ marginBottom: "50px" }}>
              <StepLabel num="1" title="Contact Information" isActive={activeStep === 1} isDone={activeStep > 1} />
              {activeStep === 1 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <CustomInput placeholder="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
                  <CustomInput placeholder="Phone Number" type="tel" value={phone} onChange={(e: any) => setPhone(e.target.value)} required />
                  <button
                    onClick={() => { if (email && phone) setActiveStep(2); else setError("Please fill email and phone."); }}
                    className="chk-btn"
                    style={{ marginTop: "10px", width: "100%", padding: "18px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}
                  >
                    Continue to Shipping
                  </button>
                </motion.div>
              )}
            </div>

            {/* Step 2: Shipping */}
            <div style={{ marginBottom: "50px" }}>
              <StepLabel num="2" title="Shipping Address" isActive={activeStep === 2} isDone={activeStep > 2} />
              {activeStep === 2 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <CustomInput placeholder="First Name" value={firstName} onChange={(e: any) => setFirstName(e.target.value)} required />
                    <CustomInput placeholder="Last Name" value={lastName} onChange={(e: any) => setLastName(e.target.value)} required />
                  </div>
                  <CustomInput placeholder="Street Address" value={address} onChange={(e: any) => setAddress(e.target.value)} required />
                  <div style={{ display: "flex", gap: "16px" }}>
                    <CustomInput placeholder="City" value={city} onChange={(e: any) => setCity(e.target.value)} required />
                    <CustomInput placeholder="State" value={state} onChange={(e: any) => setState(e.target.value)} required />
                  </div>
                  <CustomInput placeholder="Pincode" value={pincode} onChange={(e: any) => setPincode(e.target.value)} required />
                  <button
                    onClick={() => {
                      if (firstName && lastName && address && city && pincode) {
                        setActiveStep(3);
                        setError(null);
                      } else {
                        setError("Please fill all address fields.");
                      }
                    }}
                    className="chk-btn"
                    style={{ marginTop: "10px", width: "100%", padding: "18px", background: "#fff", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}
                  >
                    Continue to Payment
                  </button>
                </motion.div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div>
              <StepLabel num="3" title="Payment" isActive={activeStep === 3} isDone={false} />
              {activeStep === 3 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "24px" }}>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "0 0 16px", lineHeight: 1.6 }}>
                      Clicking "Pay Now" will open a secure Razorpay checkout window where you can complete your payment using Credit/Debit Card, UPI, Net Banking, or Wallet.
                    </p>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {['VISA', 'MASTERCARD', 'UPI', 'NET BANKING'].map(m => (
                        <span key={m} style={{ padding: "6px 12px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="chk-btn"
                    style={{
                      width: "100%", padding: "20px",
                      background: processing ? "rgba(255,255,255,0.1)" : "#fff",
                      color: processing ? "rgba(255,255,255,0.5)" : "#000",
                      border: "none", cursor: processing ? "not-allowed" : "pointer",
                      fontFamily: "'Jost', sans-serif", fontSize: "12px", fontWeight: 500,
                      letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.3s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>PAY ₹{total.toLocaleString()}</>
                    )}
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
        .chk-btn:hover:not(:disabled) {
          transform: scale(0.98);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 900px) {
          .chk-btn:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
