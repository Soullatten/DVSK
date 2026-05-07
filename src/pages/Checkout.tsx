import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle, Loader2, MapPin, CreditCard, Banknote } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AddressMapPicker, { type ResolvedAddress } from "../components/AddressMapPicker";
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

  // Map address picker — opens the Leaflet+OpenStreetMap modal so the
  // customer can pin their actual location and have address fields auto-fill.
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Payment method — 'razorpay' = online Razorpay flow (default),
  // 'cod' = Cash on Delivery (skip Razorpay, create order with notes flag
  // so the admin sees it as a COD pending order).
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const handleAddressFromMap = (resolved: ResolvedAddress) => {
    if (resolved.addressLine1) setAddress(resolved.addressLine1);
    if (resolved.city) setCity(resolved.city);
    if (resolved.state) setState(resolved.state);
    if (resolved.pincode) setPincode(resolved.pincode);
  };

  // Coupon state — verified live against /api/coupons/validate which checks
  // the same Coupon table the admin Discounts page now persists into.
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string | null;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiBase}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const body = await res.json();
      if (!res.ok || !body?.data?.ok) {
        const msg = body?.error?.message || body?.message || "Coupon not valid";
        setCouponError(msg);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: body.data.code,
        discountAmount: Number(body.data.discountAmount),
        description: body.data.description,
      });
      setCouponError(null);
      setCouponInput("");
    } catch (err: any) {
      setCouponError(err?.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Computed totals — discount comes off the subtotal BEFORE shipping/tax
  // so the customer sees the value of the coupon clearly.
  const discount = appliedCoupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxableAmount = discountedSubtotal;
  const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const total = Math.round((discountedSubtotal + shipping + tax) * 100) / 100;

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
    if (!email || !firstName || !lastName || !address || !city || !state || !pincode || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem('dvsk_auth_token');
    if (!token) {
      setError("Please log in to place an order.");
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      const order = await ordersApi.createOrder({
        shippingAddress: {
          fullName: `${firstName} ${lastName}`,
          phone,
          email,
          addressLine1: address,
          city,
          state,
          pincode,
          country: "India",
        },
        // Tag COD orders in the notes so the admin can identify them and
        // collect payment on delivery. Online (Razorpay) orders leave notes
        // empty since the Payment record itself records the method.
        notes: paymentMethod === 'cod' ? 'Cash on Delivery' : undefined,
      });

      // Cash on Delivery branch — no Razorpay flow. The order is created
      // with status PENDING; admin marks it as paid when the courier
      // collects the cash on delivery.
      if (paymentMethod === 'cod') {
        setOrderNumber(order.orderNumber);
        setOrderComplete(true);
        await clearCart();
        setProcessing(false);
        return;
      }

      const paymentData = await ordersApi.createPayment(order.id);

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
    } catch (err: any) {
      console.error("Payment error:", err);
      const apiMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message;
      setError(apiMsg || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // ORDER CONFIRMED — cinematic reveal
  //
  // Stages (timed off the same 0s start so they layer cleanly):
  //   0.0–0.6s  black-out → soft radial glow fades in
  //   0.2–1.0s  outer cream ring strokes itself in (SVG pathLength)
  //   0.9–1.4s  checkmark draws inside the ring
  //   1.0–1.6s  ring of 14 cream particles burst outward + fade
  //   1.2–2.4s  expanding cream halo pulse (fades while scaling 1→3)
  //   1.4–2.6s  text reveals stagger up: title → tagline → order # → email
  //   2.0–2.4s  CTAs fade in
  // ────────────────────────────────────────────────────────────────────────
  if (orderComplete) {
    const PARTICLES = 14;
    return (
      <div
        style={{
          backgroundColor: "#040404",
          color: "#fff",
          minHeight: "100vh",
          fontFamily: "'Jost', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Soft radial glow behind the seal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0 }}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 42%, rgba(255,235,171,0.08) 0%, rgba(255,235,171,0.03) 30%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ textAlign: "center", maxWidth: "560px", position: "relative", zIndex: 1 }}>
          {/* SEAL (ring + checkmark + particles + halo) */}
          <div
            style={{
              position: "relative",
              width: 180,
              height: 180,
              margin: "0 auto 48px",
            }}
          >
            {/* Expanding halo pulse */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 0.35, 0] }}
              transition={{ duration: 1.6, delay: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(255,235,171,0.5)",
                pointerEvents: "none",
              }}
            />

            {/* Particle burst */}
            {Array.from({ length: PARTICLES }).map((_, i) => {
              const angle = (i / PARTICLES) * Math.PI * 2;
              const distance = 110;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.1, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.3,
                    delay: 1.0 + (i % 3) * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 4,
                    height: 4,
                    marginLeft: -2,
                    marginTop: -2,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? "#ffebab" : "rgba(255,235,171,0.6)",
                    boxShadow: "0 0 8px rgba(255,235,171,0.7)",
                    pointerEvents: "none",
                  }}
                />
              );
            })}

            {/* Cream ring + checkmark SVG */}
            <svg
              viewBox="0 0 100 100"
              width="180"
              height="180"
              style={{ position: "relative", zIndex: 2 }}
            >
              {/* outer thin ring (decorative) */}
              <motion.circle
                cx="50"
                cy="50"
                r="48"
                stroke="rgba(255,235,171,0.18)"
                strokeWidth="0.5"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              {/* main stroked ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke="#ffebab"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.65, 0, 0.35, 1] }}
                transform="rotate(-90 50 50)"
              />
              {/* checkmark */}
              <motion.path
                d="M 32 51 L 45 64 L 70 38"
                stroke="#ffebab"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.95, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </svg>
          </div>

          {/* TEXT — staggered reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 18, letterSpacing: "0.02em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0em" }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              fontWeight: 300,
              margin: "0 0 18px",
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            Order Confirmed
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.55 }}
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "15px",
              marginBottom: "24px",
              fontWeight: 300,
            }}
          >
            Thank you, {firstName || "friend"}. Your order is on its way.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.7 }}
            style={{
              display: "inline-block",
              padding: "10px 22px",
              border: "1px solid rgba(255,235,171,0.35)",
              borderRadius: 999,
              background: "rgba(255,235,171,0.06)",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                color: "rgba(255,235,171,0.6)",
                fontSize: "10px",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
              ORDER
            </span>
            <span
              style={{
                color: "#ffebab",
                fontSize: "13px",
                letterSpacing: "0.15em",
                marginLeft: "10px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              #{orderNumber}
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.85 }}
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              lineHeight: 1.7,
              marginBottom: "44px",
              maxWidth: "440px",
              margin: "0 auto 44px",
            }}
          >
            {paymentMethod === 'cod'
              ? `We've recorded your Cash on Delivery order. A confirmation has been sent to ${email}. Pay the courier when your order arrives.`
              : `A confirmation email is on its way to ${email}. You can track your order status from your account at any time.`}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.0 }}
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate('/orders')}
              style={{
                padding: "16px 32px",
                background: "transparent",
                color: "#ffebab",
                border: "1px solid rgba(255,235,171,0.45)",
                cursor: "pointer",
                fontFamily: "'Jost', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,235,171,0.08)";
                e.currentTarget.style.borderColor = "#ffebab";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,235,171,0.45)";
              }}
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: "16px 36px",
                background: "#ffebab",
                color: "#000",
                border: "1px solid #ffebab",
                cursor: "pointer",
                fontFamily: "'Jost', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffe199";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffebab";
              }}
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
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

      <div className="chk-grid" style={{ display: "flex", flex: 1, flexDirection: "row", flexWrap: "wrap", minHeight: "100vh" }}>

        {/* Left Side: Order Summary from real cart */}
        <div className="chk-summary" style={{ flex: "1.2", minWidth: "400px", background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(40px, 8vw, 120px)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
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

              {/* ── Coupon code block ── */}
              <div style={{ marginTop: "8px", marginBottom: "20px", paddingTop: "16px", paddingBottom: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {appliedCoupon ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#22c55e", fontWeight: 600 }}>Coupon applied</span>
                      <span style={{ fontSize: "13px", color: "#fff", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em" }}>
                        {appliedCoupon.code} — saved ₹{appliedCoupon.discountAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 10px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
                        placeholder="DISCOUNT CODE"
                        style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", color: "#fff", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", outline: "none" }}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        style={{ background: couponLoading || !couponInput.trim() ? "rgba(255,255,255,0.1)" : "#fff", color: couponLoading || !couponInput.trim() ? "rgba(255,255,255,0.4)" : "#000", border: "none", padding: "0 22px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: couponLoading || !couponInput.trim() ? "not-allowed" : "pointer", fontWeight: 600 }}
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <span style={{ fontSize: "11px", color: "#ff7b7b", letterSpacing: "0.05em" }}>{couponError}</span>
                    )}
                  </div>
                )}
              </div>

              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "#22c55e", fontSize: "13px" }}>
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>− ₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}

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
        <div className="chk-form" style={{ flex: "1.5", minWidth: "400px", padding: "clamp(40px, 8vw, 120px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
                  {/* ── Pin on map: opens Leaflet/OpenStreetMap modal, lets the customer
                       drop a pin and auto-fill address/city/state/pincode ── */}
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "16px 20px",
                      background: "rgba(255,235,171,0.06)",
                      border: "1px solid rgba(255,235,171,0.25)",
                      color: "#ffebab",
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,235,171,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,235,171,0.06)")}
                  >
                    <MapPin size={14} />
                    Pin your address on the map
                  </button>
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

            {/* Step 3: Payment — choose between Razorpay (online) and
                 Cash on Delivery. The selected method drives the action
                 button text and which branch handlePayment takes. */}
            <div>
              <StepLabel num="3" title="Payment" isActive={activeStep === 3} isDone={false} />
              {activeStep === 3 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  {/* Method selector — two cards, click to choose */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                    {/* Razorpay (online) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        padding: "20px 16px",
                        background: paymentMethod === 'razorpay' ? "rgba(255,235,171,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${paymentMethod === 'razorpay' ? '#ffebab' : 'rgba(255,255,255,0.1)'}`,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.25s",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <CreditCard size={18} color={paymentMethod === 'razorpay' ? '#ffebab' : 'rgba(255,255,255,0.6)'} strokeWidth={1.5} />
                        <span style={{ fontSize: "13px", color: paymentMethod === 'razorpay' ? '#ffebab' : '#fff', fontWeight: 500, letterSpacing: "0.05em" }}>
                          Pay Online
                        </span>
                        {paymentMethod === 'razorpay' && (
                          <span style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", border: "1px solid #ffebab", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffebab" }} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                        Card · UPI · Net Banking · Wallet
                      </div>
                    </button>

                    {/* COD */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      style={{
                        padding: "20px 16px",
                        background: paymentMethod === 'cod' ? "rgba(255,235,171,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${paymentMethod === 'cod' ? '#ffebab' : 'rgba(255,255,255,0.1)'}`,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.25s",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <Banknote size={18} color={paymentMethod === 'cod' ? '#ffebab' : 'rgba(255,255,255,0.6)'} strokeWidth={1.5} />
                        <span style={{ fontSize: "13px", color: paymentMethod === 'cod' ? '#ffebab' : '#fff', fontWeight: 500, letterSpacing: "0.05em" }}>
                          Cash on Delivery
                        </span>
                        {paymentMethod === 'cod' && (
                          <span style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", border: "1px solid #ffebab", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffebab" }} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                        Pay with cash when you receive your order
                      </div>
                    </button>
                  </div>

                  {/* Method-specific info banner */}
                  <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "24px" }}>
                    {paymentMethod === 'razorpay' ? (
                      <>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: "0 0 14px", lineHeight: 1.6 }}>
                          Clicking "Pay Now" opens a secure Razorpay window where you complete payment using Credit/Debit Card, UPI, Net Banking, or Wallet.
                        </p>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {['VISA', 'MASTERCARD', 'UPI', 'NET BANKING'].map(m => (
                            <span key={m} style={{ padding: "5px 10px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.6 }}>
                        Your order will be placed and dispatched. Pay the courier in cash when your package arrives. No advance payment required.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="chk-btn"
                    style={{
                      width: "100%", padding: "20px",
                      background: processing ? "rgba(255,255,255,0.1)" : "#ffebab",
                      color: processing ? "rgba(255,255,255,0.5)" : "#000",
                      border: "none", cursor: processing ? "not-allowed" : "pointer",
                      fontFamily: "'Jost', sans-serif", fontSize: "12px", fontWeight: 600,
                      letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.3s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        PROCESSING...
                      </>
                    ) : paymentMethod === 'cod' ? (
                      <>PLACE COD ORDER · ₹{total.toLocaleString()}</>
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
          .chk-summary, .chk-form {
            min-width: 0 !important;
            flex: 1 1 100% !important;
            padding: 32px 20px !important;
            border-right: none !important;
          }
          .chk-summary { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        }
      `}</style>

      {/* Map address picker modal — opens from the "Pin your address" button
          in step 2 of checkout. Confirms back into addressLine1 / city /
          state / pincode via the onConfirm callback. */}
      <AddressMapPicker
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={handleAddressFromMap}
        initialQuery={address || city}
      />
    </div>
  );
}
