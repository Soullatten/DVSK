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
import Image3 from '../assets/Gemini_Generated_Image_a8lix1a8lix1a8li.png';
import Image4 from '../assets/image3.png';
import Image5 from '../assets/Gemini_Generated_Image_gczwalgczwalgczw.png';

const PRODUCTS = [
  { id: 1, name: "OBSIDIAN TRENCH", price: 1850, category: "OUTERWEAR", image: Image3, tag: "NEW SEASON" },
  { id: 2, name: "CASHMERE OVERCOAT", price: 2200, category: "OUTERWEAR", image: Image2, tag: "CORE" },
  { id: 3, name: "SILK NOIL SHIRT", price: 650, category: "SHIRTS", image: Image4, tag: "ESSENTIALS" },
  { id: 4, name: "PLEATED TROUSERS", price: 850, category: "BOTTOMS", image: productImage, tag: "FW/26" },
  { id: 5, name: "TEXTURED BLAZER", price: 1400, category: "SUITING", image: Image5, tag: "FW/26" },
  { id: 6, name: "MERINO TURTLENECK", price: 550, category: "KNITWEAR", image: Image2, tag: "CORE" },
  { id: 7, name: "COTTON POPLIN SHIRT", price: 450, category: "SHIRTS", image: Image4, tag: "ESSENTIALS" },
  { id: 8, name: "WOOL CARGO PANTS", price: 750, category: "BOTTOMS", image: productImage, tag: "NEW SEASON" },
];

const CATEGORIES = ["ALL", "OUTERWEAR", "SUITING", "SHIRTS", "KNITWEAR", "BOTTOMS"];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

export default function Menswear() {
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
    <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }} ref={containerRef}>
      <Navbar />

      <main style={{ paddingTop: "72px" }}>
        {/* Hero Section */}
        <div style={{ position: "relative", width: "100%", height: "70vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ position: "absolute", inset: 0, y: yParallax, opacity: opacityParallax }}>
            <img src={Image3} alt="Menswear Hero" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55) contrast(1.1)" }} />
          </motion.div>

          {/* Vignette Overlay for Depth */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #080808 120%)", zIndex: 1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 40%)", zIndex: 2 }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ position: "relative", zIndex: 10, textAlign: "center" }}
          >
            <p style={{ fontSize: "11px", letterSpacing: "0.5em", color: "rgba(255,255,255,0.7)", marginBottom: "24px" }}>DVSK CLO.</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(4.5rem, 12vw, 11rem)", lineHeight: 0.85, fontWeight: 300, margin: 0, textTransform: "uppercase", textShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              Menswear
            </h1>
          </motion.div>
        </div>

        {/* Collection Info & Shop Grid */}
        <div style={{ padding: "60px clamp(20px, 4vw, 56px) 100px", maxWidth: "1600px", margin: "0 auto", display: "flex", gap: "60px", flexDirection: "row", flexWrap: "wrap", position: "relative", zIndex: 10 }}>

          {/* Left Sidebar Filters */}
          <div className="filter-sidebar" style={{ width: "240px", flexShrink: 0 }}>
            <div style={{ position: "sticky", top: "120px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
                <SlidersHorizontal size={16} color="rgba(255,255,255,0.6)" />
                <h3 style={{ fontSize: "12px", letterSpacing: "0.2em", fontWeight: 400, margin: 0 }}>FILTER & SORT</h3>
              </div>

              {/* Categories */}
              <div style={{ marginBottom: "40px" }}>
                <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: "16px", textTransform: "uppercase" }}>Category</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {CATEGORIES.map(cat => (
                    <li key={cat}>
                      <button 
                        onClick={() => setActiveCategory(cat)}
                        style={{ 
                          background: activeCategory === cat ? "rgba(139, 43, 226, 0.15)" : "transparent",
                          border: activeCategory === cat ? "1px solid rgba(139, 43, 226, 0.4)" : "1px solid rgba(255,255,255,0.05)",
                          color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.45)",
                          borderRadius: "100px", padding: "8px 16px",
                          fontSize: "10px", letterSpacing: "0.15em", cursor: "pointer", fontFamily: "'Jost', sans-serif",
                          transition: "all 0.3s ease", display: "flex", alignItems: "center", textTransform: "uppercase"
                        }}
                        className="cat-btn"
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase" }}>Price</h4>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>Up to ${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="premium-slider"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Sort By */}
              <div>
                <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: "16px", textTransform: "uppercase" }}>Sort By</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {SORT_OPTIONS.map(opt => (
                    <label key={opt.value} className="sort-label" style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "6px 0" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1.5px solid ${sortBy === opt.value ? '#8B2BE2' : 'rgba(255,255,255,0.2)'}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", boxShadow: sortBy === opt.value ? "0 0 10px rgba(139,43,226,0.3)" : "none" }}>
                        <AnimatePresence>
                          {sortBy === opt.value && (
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}
                              style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8B2BE2", boxShadow: "0 0 6px #8B2BE2" }}
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
                      <span style={{ fontSize: "12px", letterSpacing: "0.1em", color: sortBy === opt.value ? "#fff" : "rgba(255,255,255,0.45)", transition: "color 0.3s", textTransform: "uppercase" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>SHOWING {filteredProducts.length} {filteredProducts.length === 1 ? 'RESULT' : 'RESULTS'}</span>
            </div>

            <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "50px 30px" }}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod) => (
                  <motion.div
                    layout
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ cursor: "pointer", textAlign: "left" }}
                    className="product-wrapper"
                  >
                    <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", position: "relative", marginBottom: "16px", background: "rgba(255,255,255,0.02)" }}>
                      <img src={prod.image} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease" }} className="product-image" />

                      {/* Interactive View Overlay */}
                      <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.4)", opacity: 0, transition: "opacity 0.4s", display: "flex", alignItems: "center", justifyContent: "center" }} className="product-overlay">
                        <span style={{ padding: "12px 28px", background: "rgba(139, 43, 226, 0.2)", border: "1px solid rgba(139, 43, 226, 0.5)", borderRadius: "100px", fontSize: "10px", letterSpacing: "0.25em", backdropFilter: "blur(8px)", color: "#fff", transition: "all 0.3s ease", boxShadow: "0 4px 20px rgba(139, 43, 226, 0.2)" }} className="view-btn">QUICK VIEW</span>
                      </div>

                      <div style={{ position: "absolute", top: "15px", left: "15px", background: "rgba(0,0,0,0.4)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "4px 8px", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.9)" }}>
                        {prod.tag}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <h3 style={{ fontSize: "13px", fontWeight: 400, letterSpacing: "0.1em", margin: 0, textTransform: "uppercase" }}>{prod.name}</h3>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 300, letterSpacing: "0.05em" }}>${prod.price.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>{prod.category}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredProducts.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "120px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                <SlidersHorizontal size={32} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 20px" }} />
                <p style={{ fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>No results match your exact criteria.</p>
                <button onClick={() => { setActiveCategory("ALL"); setMaxPrice(2500); setSortBy("featured"); }} style={{ marginTop: "24px", background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", padding: "12px 32px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase", transition: "all 0.3s ease" }} className="reset-btn">
                  CLEAR ALL FILTERS
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .product-wrapper:hover .product-image {
          transform: scale(1.05); 
          filter: brightness(0.9);
        }
        .product-wrapper:hover .product-overlay {
          opacity: 1;
        }
        .view-btn:hover {
          background: rgba(139, 43, 226, 0.5) !important;
          box-shadow: 0 4px 30px rgba(139, 43, 226, 0.6) !important;
          transform: scale(1.05);
        }
        .reset-btn:hover {
          background: rgba(139, 43, 226, 0.3);
          border-color: #8B2BE2;
          box-shadow: 0 0 20px rgba(139, 43, 226, 0.4);
        }
        .cat-btn:hover {
          border-color: rgba(139, 43, 226, 0.6) !important;
          background: rgba(139, 43, 226, 0.1);
        }
        .sort-label:hover span {
          color: #fff !important;
        }

        /* Custom Slider Styling */
        .premium-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          opacity: 0.8;
          -webkit-transition: .2s;
          transition: opacity .2s;
        }

        .premium-slider:hover {
          opacity: 1;
        }

        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 2px solid #080808;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5), 0 0 10px rgba(139, 43, 226, 0.4);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: 2px solid #080808;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5), 0 0 10px rgba(139, 43, 226, 0.4);
        }
        
        .premium-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 0 1px #8B2BE2, 0 0 15px rgba(139, 43, 226, 0.8);
        }

        @media (max-width: 900px) {
          .filter-sidebar {
            width: 100% !important;
            border-bottom: 0.5px solid rgba(255,255,255,0.08);
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
