import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import productImage from '../assets/image6.png';
import Image2 from '../assets/image7.avif';
import Image3 from '../assets/image01.png';
import Image4 from '../assets/image3.png';
import Image5 from '../assets/image03.png';

const PRODUCTS = [
  { id: 1, name: "Silk Chiffon Slip", price: 1850, category: "DRESSES", image: Image3, tag: "NEW SEASON" },
  { id: 2, name: "Cashmere Cardigan", price: 1200, category: "KNITWEAR", image: Image2, tag: "CORE" },
  { id: 3, name: "Chantilly Lace Camisole", price: 650, category: "TOPS", image: Image4, tag: "ESSENTIALS" },
  { id: 4, name: "Pleated Velvet Maxi", price: 850, category: "BOTTOMS", image: productImage, tag: "SS/26" },
  { id: 5, name: "Tailored Hourglass Blazer", price: 1400, category: "SUITING", image: Image5, tag: "SS/26" },
  { id: 6, name: "Merino Wrap Coat", price: 2550, category: "OUTERWEAR", image: Image2, tag: "CORE" },
  { id: 7, name: "Liquid Satin Blouse", price: 450, category: "TOPS", image: Image4, tag: "ESSENTIALS" },
  { id: 8, name: "Sculpted Leather Corset", price: 750, category: "TOPS", image: productImage, tag: "NEW SEASON" },
];

const CATEGORIES = ["ALL", "DRESSES", "OUTERWEAR", "TOPS", "KNITWEAR", "BOTTOMS", "SUITING"];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

export default function Womenswear() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityParallax = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4, // slightly slower for a more graceful feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const filteredProducts = PRODUCTS.filter(p => {
    if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
    if (p.price > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0; // featured
  });

  return (
    <div style={{ backgroundColor: "#12090c", color: "#fff9fa", minHeight: "100vh", fontFamily: "'Jost', sans-serif", position: "relative", overflow: "hidden" }} ref={containerRef}>
      <Navbar />

      {/* AMBIENT FEMININE GLOW PARTICLES / ORBS */}
      <motion.div 
         animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }} 
         transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
         style={{ position: "absolute", top: "5%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(230, 122, 154, 0.15) 0%, transparent 60%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} 
      />
      <motion.div 
         animate={{ y: [0, 50, 0], x: [0, -30, 0], opacity: [0.15, 0.3, 0.15] }} 
         transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
         style={{ position: "absolute", top: "50%", right: "-15%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(229, 192, 123, 0.1) 0%, transparent 60%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} 
      />

      <main style={{ paddingTop: "72px", position: "relative", zIndex: 1 }}>
        {/* Hero Section */}
        <div style={{ position: "relative", width: "100%", height: "70vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ position: "absolute", inset: 0, y: yParallax, opacity: opacityParallax }}>
            {/* Adding a subtle sepia & hue shift to instantly warm the hero image aesthetic */}
            <img src={Image4} alt="Womenswear Hero" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75) contrast(1.05) sepia(0.15) hue-rotate(-10deg)" }} />
          </motion.div>

          {/* Vignette Overlay fading to deep Mulberry/Plum black */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #12090c 130%)", zIndex: 1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #12090c 0%, transparent 50%)", zIndex: 2 }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ position: "relative", zIndex: 10, textAlign: "center" }}
          >
            <p style={{ fontSize: "11px", letterSpacing: "0.5em", color: "#e67a9a", marginBottom: "16px", textTransform: "uppercase" }}>DVSK CLO.</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(5.5rem, 15vw, 13rem)", lineHeight: 0.85, fontWeight: 300, fontStyle: "italic", margin: 0, textShadow: "0 20px 40px rgba(230, 122, 154, 0.3)", color: "#fff9fa" }}>
              Womenswear
            </h1>
          </motion.div>
        </div>

        {/* Collection Info & Shop Grid */}
        <div style={{ padding: "60px clamp(20px, 4vw, 56px) 100px", maxWidth: "1600px", margin: "0 auto", display: "flex", gap: "60px", flexDirection: "row", flexWrap: "wrap", position: "relative", zIndex: 10 }}>
          
          {/* Left Sidebar Filters */}
          <div className="filter-sidebar" style={{ width: "240px", flexShrink: 0 }}>
            <div style={{ position: "sticky", top: "120px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", borderBottom: "0.5px solid rgba(230, 122, 154, 0.15)", paddingBottom: "20px" }}>
                <SlidersHorizontal size={16} color="#e67a9a" />
                <h3 style={{ fontSize: "12px", letterSpacing: "0.2em", fontWeight: 400, margin: 0, color: "#fff9fa" }}>FILTER & SORT</h3>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: "40px" }}>
                <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,249,250,0.5)", marginBottom: "16px", textTransform: "uppercase" }}>Collection</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                  {CATEGORIES.map(cat => (
                    <li key={cat}>
                      <button 
                        onClick={() => setActiveCategory(cat)}
                        style={{ 
                          background: "none", border: "none", color: activeCategory === cat ? "#fff9fa" : "rgba(255,249,250,0.4)", 
                          fontSize: "12px", letterSpacing: "0.15em", cursor: "pointer", padding: 0, fontFamily: "'Jost', sans-serif",
                          transition: "color 0.4s ease", display: "flex", alignItems: "center", gap: "12px", textTransform: "uppercase"
                        }}
                      >
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: activeCategory === cat ? "#e67a9a" : "transparent", transition: "background-color 0.4s ease, box-shadow 0.4s ease", boxShadow: activeCategory === cat ? "0 0 10px #e67a9a" : "none" }} />
                        <span style={{ transform: activeCategory === cat ? "translateX(4px)" : "translateX(0)", transition: "transform 0.4s ease" }}>{cat}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,249,250,0.5)", margin: 0, textTransform: "uppercase" }}>Price Focus</h4>
                  <span style={{ fontSize: "11px", color: "#e67a9a", letterSpacing: "0.1em" }}>Up to ${maxPrice}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2500" 
                  step="50"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="girly-slider"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Sort By */}
              <div>
                <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,249,250,0.5)", marginBottom: "16px", textTransform: "uppercase" }}>Sort Selection</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {SORT_OPTIONS.map(opt => (
                    <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1px solid ${sortBy === opt.value ? '#e67a9a' : 'rgba(230, 122, 154, 0.2)'}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.4s" }}>
                        <AnimatePresence>
                          {sortBy === opt.value && (
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.3 }}
                              style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e67a9a", boxShadow: "0 0 8px #e67a9a" }}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="radio" 
                        name="sort" 
                        value={opt.value} 
                        checked={sortBy === opt.value} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: "12px", letterSpacing: "0.1em", color: sortBy === opt.value ? "#fff9fa" : "rgba(255,249,250,0.4)", transition: "color 0.4s", textTransform: "uppercase" }}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right Main Content */}
          <div style={{ flex: 1, minWidth: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "0.5px solid rgba(230, 122, 154, 0.15)", paddingBottom: "20px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,249,250,0.5)" }}>VIEWING {filteredProducts.length} {filteredProducts.length === 1 ? 'PIECE' : 'PIECES'}</span>
            </div>

            <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "60px 40px" }}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod) => (
                  <motion.div 
                    layout
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ cursor: "pointer", textAlign: "left" }}
                    className="product-wrapper"
                  >
                    {/* Rounded Image Borders for softer aesthetic */}
                    <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", position: "relative", marginBottom: "20px", background: "rgba(230, 122, 154, 0.03)", borderRadius: "16px", border: "1px solid rgba(230, 122, 154, 0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                      <img src={prod.image} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease" }} className="product-image" />
                      
                      {/* Chic View Overlay */}
                      <div style={{ position: "absolute", inset: 0, background: "rgba(18, 9, 12, 0.25)", opacity: 0, transition: "opacity 0.5s", display: "flex", alignItems: "center", justifyContent: "center" }} className="product-overlay">
                        <span style={{ padding: "12px 28px", background: "rgba(230, 122, 154, 0.1)", border: "1px solid rgba(230, 122, 154, 0.3)", borderRadius: "100px", fontSize: "10px", letterSpacing: "0.2em", backdropFilter: "blur(12px)", color: "#fff9fa", transition: "all 0.4s ease" }} className="view-btn">QUICK VIEW</span>
                      </div>

                      <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(0,0,0,0.3)", border: "0.5px solid rgba(230, 122, 154, 0.15)", backdropFilter: "blur(10px)", padding: "6px 12px", fontSize: "9px", letterSpacing: "0.2em", color: "#e67a9a", borderRadius: "100px" }}>
                        {prod.tag}
                      </div>
                    </div>
                    {/* Delicate Typography for Product Info */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "20px", fontWeight: 400, letterSpacing: "0.02em", margin: 0, color: "#fff9fa" }}>{prod.name}</h3>
                      <span style={{ fontSize: "13px", color: "rgba(255,249,250,0.7)", fontWeight: 300, letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif" }}>${prod.price.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(230, 122, 154, 0.6)", marginTop: "6px", letterSpacing: "0.15em", textTransform: "uppercase" }}>{prod.category}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            
            {filteredProducts.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "120px 0", textAlign: "center", color: "rgba(255,249,250,0.4)" }}>
                <SlidersHorizontal size={32} color="rgba(230, 122, 154, 0.2)" style={{ margin: "0 auto 20px" }} />
                <p style={{ fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>No pieces match your exact criteria.</p>
                <button onClick={() => { setActiveCategory("ALL"); setMaxPrice(2500); setSortBy("featured"); }} style={{ marginTop: "24px", background: "none", border: "0.5px solid rgba(230, 122, 154, 0.3)", borderRadius: "100px", padding: "12px 32px", color: "#e67a9a", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase", transition: "all 0.4s ease" }} className="reset-btn">
                  CLEAR FILTERS
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .product-wrapper:hover .product-image {
          transform: scale(1.04); 
          filter: brightness(0.9) saturate(1.1);
        }
        .product-wrapper:hover .product-overlay {
          opacity: 1;
        }
        .view-btn:hover {
          background: rgba(230, 122, 154, 0.25) !important;
          border-color: #e67a9a !important;
          color: #fff;
        }
        .reset-btn:hover {
          background: rgba(230, 122, 154, 0.1);
          border-color: #e67a9a;
          color: #fff9fa;
        }

        /* Feminine Chic Slider Styling */
        .girly-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 1px;
          background: rgba(230, 122, 154, 0.2);
          outline: none;
          opacity: 0.8;
          -webkit-transition: .4s;
          transition: opacity .4s;
        }

        .girly-slider:hover {
          opacity: 1;
        }

        .girly-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff9fa;
          cursor: pointer;
          border: 1px solid #e67a9a;
          box-shadow: 0 0 0 4px rgba(230, 122, 154, 0.1), 0 0 12px rgba(230, 122, 154, 0.5);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .girly-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff9fa;
          cursor: pointer;
          border: 1px solid #e67a9a;
          box-shadow: 0 0 0 4px rgba(230, 122, 154, 0.1), 0 0 12px rgba(230, 122, 154, 0.5);
        }
        
        .girly-slider::-webkit-slider-thumb:hover {
          transform: scale(1.4);
          box-shadow: 0 0 0 2px #e67a9a, 0 0 20px rgba(230, 122, 154, 0.8);
        }

        @media (max-width: 900px) {
          .filter-sidebar {
            width: 100% !important;
            border-bottom: 0.5px solid rgba(230, 122, 154, 0.15);
            padding-bottom: 30px;
            margin-bottom: 10px;
          }
          .filter-sidebar > div {
            position: relative !important;
            top: 0 !important;
            display: flex;
            flex-wrap: wrap;
            gap: 20px 40px;
            justify-content: flex-start;
          }
          .filter-sidebar > div > div {
            flex: 1;
            min-width: 200px;
            margin-bottom: 20px !important;
          }
          .filter-sidebar > div > div:first-child {
             width: 100%;
             flex: none;
             margin-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
