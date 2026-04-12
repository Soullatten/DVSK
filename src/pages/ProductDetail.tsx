import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ChevronDown, Plus, Minus, Star, ArrowRight } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Images
import imageMain from '../assets/image6.png';
import imageAlt1 from '../assets/image7.avif';
import imageAlt2 from '../assets/image3.png';
import imageAlt3 from '../assets/image01.png';
import imageAlt4 from '../assets/image03.png';

const GALLERY = [imageMain, imageAlt1, imageAlt2, imageAlt3, imageAlt4];
const SIZES = ["S", "M", "L", "XL"];

const CROSS_SELL = [
  { id: 2, name: "CASHMERE OVERCOAT", price: 2200, category: "OUTERWEAR", image: imageAlt1 },
  { id: 3, name: "SILK NOIL SHIRT", price: 650, category: "SHIRTS", image: imageAlt2 },
  { id: 4, name: "PLEATED TROUSERS", price: 850, category: "BOTTOMS", image: imageMain },
  { id: 5, name: "TEXTURED BLAZER", price: 1400, category: "SUITING", image: imageAlt4 },
];

const MOCK_REVIEWS = [
  { id: 1, author: "A. Kingston", rating: 5, date: "Oct 24, 2025", text: "The architectural drape of this piece is impeccable. The weight of the gabardine justifies the price point entirely." },
  { id: 2, author: "M. Russo", rating: 5, date: "Sep 12, 2025", text: "Perfect tailored fit. Feels highly structural but retains movement." }
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Gallery Scroll Tracker
  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ["start center", "end center"]
  });
  const indicatorHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("details");
  
  // Review form state
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  return (
    <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }} ref={containerRef}>
      <Navbar />

      <main style={{ paddingTop: "140px", paddingBottom: "100px", maxWidth: "1800px", margin: "0 auto", paddingLeft: "clamp(20px, 4vw, 60px)", paddingRight: "clamp(20px, 4vw, 60px)" }}>
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "40px", transition: "color 0.3s" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
        >
          <ArrowLeft size={14} /> Back to Collection
        </button>

        <div style={{ display: "flex", gap: "clamp(40px, 8vw, 100px)", alignItems: "flex-start", flexWrap: "wrap", position: "relative" }}>
          
          {/* Animated Scroll Progress Bar (Left Sidebar) */}
          <div style={{ position: "sticky", top: "140px", height: "60vh", width: "2px", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }} className="scroll-tracker">
            <motion.div style={{ width: "100%", background: "#fff", height: indicatorHeight }} />
          </div>

          {/* Left Column: Image Gallery (Scrollable) */}
          <div ref={galleryRef} className="pdp-gallery" style={{ flex: "1.5", minWidth: "400px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {GALLERY.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ width: "100%", background: "#111", overflow: "hidden", position: "relative" }}
              >
                <img src={img} style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} alt={`Product Angle ${idx + 1}`} />
                {/* Index tag */}
                <div style={{ position: "absolute", bottom: "20px", left: "20px", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", fontFamily: "'Jost', sans-serif" }}>
                  0{idx + 1} / 0{GALLERY.length}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Sticky Product Info */}
          <div className="pdp-info" style={{ flex: "1", minWidth: "350px", position: "sticky", top: "140px", paddingBottom: "40px" }}>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 300, lineHeight: 1.1, margin: 0, color: "#fff" }}>
                  Obsidian Trench {id && `#${id}`}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "30px" }}>
                <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.9)", margin: 0, letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif" }}>$1,850.00</p>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#fff" color="#fff" />)}
                  <span style={{ fontSize: "11px", marginLeft: "6px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>(2 Reviews)</span>
                </div>
              </div>
              
              <div style={{ paddingBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "40px" }}>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontWeight: 300, letterSpacing: "0.02em" }}>
                  A masterful execution of architectural brutalism applied to outerwear. The Obsidian Trench is cut from treated heavy-weight gabardine with structural shoulders and a rigid, flowing drape. Water-resistant and lined with thermal silk layers.
                </p>
              </div>

              {/* Sizing Selector */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Select Size</span>
                  <a href="#" style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "underline", transition: "color 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>Size Guide</a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {SIZES.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{ 
                        background: "transparent",
                        color: selectedSize === size ? "#fff" : "rgba(255,255,255,0.6)",
                        border: selectedSize === size ? "1px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                        padding: "16px 0", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "0.1em",
                        transition: "all 0.3s ease",
                        position: "relative", overflow: "hidden"
                      }}
                      className="size-btn"
                    >
                      {/* Animated Active Background */}
                      <AnimatePresence>
                        {selectedSize === size && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.3 }}
                          style={{ position: "absolute", inset: 0, background: "#fff", zIndex: -1 }} />
                        )}
                      </AnimatePresence>
                      <span style={{ position: "relative", zIndex: 2, color: selectedSize === size ? "#000" : "inherit" }}>{size}</span>
                    </button>
                  ))}
                </div>
                {!selectedSize && <p style={{ fontSize: "11px", color: "#ff4d4d", marginTop: "12px", display: "none" }} id="size-error">Please select a size.</p>}
              </div>

              {/* Enhanced Add to Cart Controller */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "50px", height: "60px" }}>
                {/* Modern Quantity Selector */}
                <div className="qty-selector" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.2)", width: "130px", justifyContent: "space-between", padding: "0", transition: "border-color 0.3s", height: "100%" }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="qty-btn" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", height: "100%", padding: "0 16px", opacity: qty <= 1 ? 0.3 : 1, transition: "background 0.3s" }}><Minus size={14} /></button>
                  <span style={{ fontSize: "14px", color: "#fff", fontFamily: "'Jost', sans-serif" }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="qty-btn" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", height: "100%", padding: "0 16px", transition: "background 0.3s" }}><Plus size={14} /></button>
                </div>
                
                {/* Expanding Buy Button */}
                <button 
                  onClick={() => {
                    if (!selectedSize) {
                      const errorEl = document.getElementById('size-error');
                      if (errorEl) errorEl.style.display = 'block';
                      return;
                    }
                    alert("Order Initiated!");
                  }}
                  style={{
                    flex: 1, background: "#fff", color: "#000", border: "none", height: "100%",
                    fontFamily: "'Jost', sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
                  }}
                  className="elegant-buy-btn"
                >
                  <span style={{ zIndex: 2, position: "relative" }}>ADD TO CART</span>
                  <ArrowRight size={16} className="buy-arrow" style={{ zIndex: 2, position: "relative", transition: "transform 0.4s" }} />
                  {/* Subtle hover pulse */}
                  <div className="buy-hover-bg" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", transform: "scaleY(0)", transformOrigin: "bottom", transition: "transform 0.4s", zIndex: 1 }} />
                </button>
              </div>

              {/* Accordions */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                {[
                  { id: "details", title: "Details & Care", content: "Dry clean only. Outer: 100% Cotton Gabardine. Lining: 100% Silk. Made in Italy." },
                  { id: "shipping", title: "Shipping & Returns", content: "Free worldwide express shipping on orders over $2500. Complimentary returns within 14 days of receipt." }
                ].map((acc) => (
                  <div key={acc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <button 
                      onClick={() => toggleAccordion(acc.id)}
                      style={{ width: "100%", background: "none", border: "none", padding: "24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#fff" }}
                    >
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>{acc.title}</span>
                      <motion.div animate={{ rotate: activeAccordion === acc.id ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {activeAccordion === acc.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p style={{ paddingBottom: "24px", margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1.6, fontWeight: 300 }}>
                            {acc.content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.05)", margin: "100px 0" }} />

        {/* Bottom Section: Reviews & Client Feedback */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "100px" }}>
          
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 300, marginBottom: "40px" }}>Client Reviews</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {MOCK_REVIEWS.map(rev => (
                <div key={rev.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "30px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{rev.author}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{rev.date}</p>
                  </div>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < rev.rating ? "#fff" : "transparent"} color={i < rev.rating ? "#fff" : "rgba(255,255,255,0.2)"} />)}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, fontWeight: 300 }}>
                    "{rev.text}"
                  </p>
                </div>
              ))}
            </div>

            {/* Custom Review Submission Box */}
            <div style={{ marginTop: "50px", background: "rgba(255,255,255,0.02)", padding: "30px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px" }}>Write a Review</h3>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts on the fit, material, and construction..."
                style={{ width: "100%", minHeight: "100px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "16px", fontFamily: "'Jost', sans-serif", fontSize: "13px", resize: "vertical", outline: "none", marginBottom: "20px" }}
                className="review-input"
              />
              <button 
                onClick={() => { if(reviewText) { alert("Review submitted for moderation."); setReviewText(""); } }}
                style={{ background: "#fff", color: "#000", border: "none", padding: "12px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}
                className="submit-review-btn"
              >
                Submit Feedback
              </button>
            </div>
          </div>

          {/* Cross Sell / Up Sell */}
          <div style={{ flex: "1.5", minWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "40px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 300, margin: 0 }}>You May Also Like</h2>
              <a href="#" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", textDecoration: "none" }}>View All</a>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "30px" }}>
              {CROSS_SELL.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => navigate(`/product/${prod.id}`)}
                  style={{ cursor: "pointer" }}
                  className="cross-sell-wrapper"
                >
                  <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", position: "relative", marginBottom: "16px" }}>
                    <img src={prod.image} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.8s ease, filter 0.4s ease" }} className="cross-sell-image" />
                    <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", padding: "4px 8px", fontSize: "9px", letterSpacing: "0.15em", color: "#fff" }}>
                      {prod.category}
                    </div>
                  </div>
                  <h3 style={{ fontSize: "12px", fontWeight: 400, letterSpacing: "0.1em", margin: "0 0 8px 0", textTransform: "uppercase" }}>{prod.name}</h3>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>${prod.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .size-btn:hover {
          border-color: #fff !important;
        }
        
        .qty-selector:hover { border-color: rgba(255,255,255,0.5) !important; }
        .qty-btn:hover { background: rgba(255,255,255,0.1) !important; }

        .elegant-buy-btn:hover {
          background: #e6e6e6;
        }
        .elegant-buy-btn:hover .buy-arrow {
          transform: translateX(4px);
        }
        .elegant-buy-btn:hover .buy-hover-bg {
          transform: scaleY(1);
        }

        .review-input:focus {
          border-color: rgba(255,255,255,0.4) !important;
        }
        .submit-review-btn:hover {
          transform: scale(0.98);
        }

        .cross-sell-wrapper:hover .cross-sell-image {
          transform: scale(1.05);
          filter: brightness(0.85);
        }
        
        @media (max-width: 1024px) {
          .pdp-gallery {
            flex: initial !important;
            width: 100%;
          }
          .pdp-info {
            position: relative !important;
            top: 0 !important;
          }
          .scroll-tracker { display: none !important; }
        }
      `}</style>
    </div>
  );
}
