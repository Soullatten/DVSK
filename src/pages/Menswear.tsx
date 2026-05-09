import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TypeFilterBar, { matchesType, type TypeFilterEntry } from "../components/TypeFilterBar";
import ProductCardCinematic from "../components/ProductCardCinematic";
import { productsApi } from "../api/products";
import type { Product } from "../api/types";

const APPAREL_FILTERS: TypeFilterEntry[] = [
  { key: "ALL", label: "All", keywords: [] },
  { key: "TSHIRT", label: "T-Shirt", keywords: ["t-shirt", "tshirt", "tee", "shirt", "polo"] },
  { key: "PANTS", label: "Pants", keywords: ["pant", "jeans", "trouser", "cargo", "baggy", "joggers"] },
  { key: "JERSEY", label: "Jersey", keywords: ["jersey"] },
  { key: "HOODIE", label: "Hoodie", keywords: ["hoodie", "hoody", "sweatshirt", "sweater"] },
  { key: "JACKET", label: "Jacket", keywords: ["jacket", "coat", "blazer", "vest", "puffer"] },
  { key: "SHORTS", label: "Shorts", keywords: ["short"] },
];

import heroImage from '../assets/image8.jpg';

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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("featured");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const activeFilterEntry = APPAREL_FILTERS.find((f) => f.key === typeFilter) || APPAREL_FILTERS[0];

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

  // Fetch live products from backend
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await productsApi.getProducts({ gender: 'MEN', limit: 50 });
        setProducts(res.data);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Extract unique categories from live data
  const CATEGORIES = ["ALL", ...Array.from(new Set(products.map(p => p.category.name.toUpperCase())))];

  const filteredProducts = products.filter(p => {
    if (activeCategory !== "ALL" && p.category.name.toUpperCase() !== activeCategory) return false;
    if (Number(p.salePrice || p.basePrice) > maxPrice) return false;
    if (!matchesType(p.name, activeFilterEntry)) return false;
    return true;
  }).sort((a, b) => {
    const priceA = Number(a.salePrice || a.basePrice);
    const priceB = Number(b.salePrice || b.basePrice);
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    return 0; // featured
  });

  return (
    <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }} ref={containerRef}>
      <Navbar />

      <main style={{ paddingTop: "72px" }}>
        {/* Hero Section */}
        <div style={{ position: "relative", width: "100%", height: "70vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ position: "absolute", inset: 0, y: yParallax, opacity: opacityParallax }}>
            <img src={heroImage} alt="Menswear Hero" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55) contrast(1.1)" }} />
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
              Men
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
                  max="10000"
                  step="100"
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
            <TypeFilterBar
              products={products.filter(p => activeCategory === "ALL" || p.category.name.toUpperCase() === activeCategory)}
              filters={APPAREL_FILTERS}
              active={typeFilter}
              onChange={setTypeFilter}
              resultCount={filteredProducts.length}
              sortValue={sortBy}
              sortOptions={SORT_OPTIONS}
              onSortChange={setSortBy}
            />

            <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "50px 30px" }}>
              {loading ? (
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "20px" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <Loader2 size={28} color="rgba(139, 43, 226, 0.6)" />
                  </motion.div>
                  <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading collection...</span>
                </div>
              ) : error ? (
                <div style={{ gridColumn: "1 / -1", padding: "120px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                  <p style={{ fontSize: "14px", letterSpacing: "0.1em" }}>{error}</p>
                  <button onClick={() => window.location.reload()} style={{ marginTop: "24px", background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", padding: "12px 32px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase" }} className="reset-btn">RETRY</button>
                </div>
              ) : (
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod, i) => (
                  <ProductCardCinematic key={prod.id} product={prod as any} index={i} />
                ))}
              </AnimatePresence>
              )}
            </motion.div>

            {filteredProducts.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "120px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                <SlidersHorizontal size={32} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 20px" }} />
                <p style={{ fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>No results match your exact criteria.</p>
                <button onClick={() => { setActiveCategory("ALL"); setMaxPrice(10000); setSortBy("featured"); }} style={{ marginTop: "24px", background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", padding: "12px 32px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase", transition: "all 0.3s ease" }} className="reset-btn">
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
        @media (max-width: 640px) {
          .filter-sidebar > div > div { min-width: 100% !important; flex: none !important; }
        }
      `}</style>
    </div>
  );
}
