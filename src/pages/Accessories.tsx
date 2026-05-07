import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TypeFilterBar, { matchesType, type TypeFilterEntry } from "../components/TypeFilterBar";
import { productsApi } from "../api/products";
import type { Product } from "../api/types";

import productImage from '../assets/image6.png';

const ACCESSORY_FILTERS: TypeFilterEntry[] = [
  { key: "ALL", label: "All", keywords: [] },
  { key: "BAGS", label: "Bags", keywords: ["bag", "tote", "backpack", "duffle", "duffel"] },
  { key: "CAPS", label: "Caps & Hats", keywords: ["cap", "hat", "beanie"] },
  { key: "EYEWEAR", label: "Eyewear", keywords: ["sunglasses", "glasses", "shades", "eyewear"] },
  { key: "JEWELRY", label: "Jewelry", keywords: ["chain", "necklace", "ring", "bracelet", "earring", "jewelry"] },
  { key: "WATCHES", label: "Watches", keywords: ["watch"] },
  { key: "BELTS", label: "Belts", keywords: ["belt"] },
  { key: "WALLETS", label: "Wallets", keywords: ["wallet", "purse", "card holder"] },
];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

export default function Accessories() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityParallax = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("featured");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const activeFilterEntry = ACCESSORY_FILTERS.find((f) => f.key === typeFilter) || ACCESSORY_FILTERS[0];

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
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await productsApi.getProducts({ category: 'accessories', limit: 50 });
        setProducts(res.data);
      } catch (err: any) {
        console.error('Failed to fetch accessories:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    if (Number(p.salePrice || p.basePrice) > maxPrice) return false;
    if (!matchesType(p.name, activeFilterEntry)) return false;
    return true;
  }).sort((a, b) => {
    const priceA = Number(a.salePrice || a.basePrice);
    const priceB = Number(b.salePrice || b.basePrice);
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    return 0;
  });

  return (
    <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", overflowX: "hidden" }} ref={containerRef}>
      <Navbar />

      <main style={{ paddingTop: "72px" }}>
        {/* Hero Section */}
        <div style={{ position: "relative", width: "100%", height: "70vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ position: "absolute", inset: 0, y: yParallax, opacity: opacityParallax }}>
            <img src={productImage} alt="Accessories Hero" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55) contrast(1.1)" }} />
          </motion.div>

          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #080808 120%)", zIndex: 1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 40%)", zIndex: 2 }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ position: "relative", zIndex: 10, textAlign: "center", width: "100%", padding: "0 20px" }}
          >
            <p style={{ fontSize: "11px", letterSpacing: "0.5em", color: "rgba(255,255,255,0.7)", marginBottom: "24px" }}>DVSK CLO.</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(3.5rem, 10vw, 9rem)", lineHeight: 0.85, fontWeight: 300, margin: 0, textTransform: "uppercase", textShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              Accessories
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
                <h3 style={{ fontSize: "12px", letterSpacing: "0.2em", fontWeight: 400, margin: 0 }}>FILTERS</h3>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase" }}>Price</h4>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>Up to ₹{maxPrice.toLocaleString()}</span>
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
            </div>
          </div>

          {/* Right Main Content */}
          <div style={{ flex: 1, minWidth: "320px", overflow: "hidden" }}>
            <TypeFilterBar
              products={products}
              filters={ACCESSORY_FILTERS}
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
                {filteredProducts.map((prod) => (
                  <motion.div
                    layout
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.slug}`)}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
                    className="product-wrapper"
                  >
                    <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", position: "relative", marginBottom: "16px", background: "linear-gradient(135deg, #0a0a0a 0%, #161616 50%, #0a0a0a 100%)" }}>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>No Image</div>
                        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)" }}>DVSK</div>
                      </div>
                      {prod.images?.[0]?.url && (
                        <img
                          src={prod.images[0].url}
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1, transition: "transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease" }}
                          className="product-image"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}

                      <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.4)", opacity: 0, transition: "opacity 0.4s", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }} className="product-overlay">
                        <span style={{ padding: "12px 28px", background: "rgba(139, 43, 226, 0.2)", border: "1px solid rgba(139, 43, 226, 0.5)", borderRadius: "100px", fontSize: "10px", letterSpacing: "0.25em", backdropFilter: "blur(8px)", color: "#fff", transition: "all 0.3s ease", boxShadow: "0 4px 20px rgba(139, 43, 226, 0.2)" }} className="view-btn">QUICK VIEW</span>
                      </div>

                      <div style={{ position: "absolute", top: "15px", left: "15px", background: "rgba(0,0,0,0.4)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "4px 8px", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.9)", zIndex: 3 }}>
                        {prod.tag.replace('_', ' ')}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <h3 style={{ fontSize: "13px", fontWeight: 400, letterSpacing: "0.1em", margin: 0, textTransform: "uppercase" }}>{prod.name}</h3>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 300, letterSpacing: "0.05em" }}>
                        {prod.salePrice ? (
                          <><span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)", marginRight: "8px" }}>₹{Number(prod.basePrice).toLocaleString()}</span>₹{Number(prod.salePrice).toLocaleString()}</>
                        ) : (
                          <>₹{Number(prod.basePrice).toLocaleString()}</>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>{prod.category.name}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              )}
            </motion.div>

            {!loading && !error && filteredProducts.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "120px 0", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                <SlidersHorizontal size={32} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 20px" }} />
                <p style={{ fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>No accessories match your filters.</p>
                <button onClick={() => { setMaxPrice(10000); setSortBy("featured"); setTypeFilter("ALL"); }} style={{ marginTop: "24px", background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", padding: "12px 32px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase", transition: "all 0.3s ease" }} className="reset-btn">
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
          transform: scale(1.05);
          filter: brightness(0.85);
        }
        .product-wrapper:hover .product-overlay {
          opacity: 1;
        }
        .view-btn:hover {
          background: rgba(139, 43, 226, 0.5) !important;
          box-shadow: 0 4px 30px rgba(139, 43, 226, 0.6) !important;
        }
        .reset-btn:hover {
          background: rgba(139, 43, 226, 0.3);
          border-color: #8B2BE2;
          box-shadow: 0 0 20px rgba(139, 43, 226, 0.4);
        }
        .premium-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          background: rgba(255,255,255,0.1);
          outline: none;
          border-radius: 1px;
        }
        .premium-slider:hover {
          background: rgba(139,43,226,0.3);
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.5), 0 0 10px rgba(139,43,226,0.4);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .premium-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.5), 0 0 10px rgba(139,43,226,0.4);
        }
        .premium-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 0 2px #8B2BE2, 0 0 15px rgba(139,43,226,0.7);
        }
        @media (max-width: 900px) {
          .filter-sidebar {
            width: 100% !important;
            border-bottom: 0.5px solid rgba(255,255,255,0.08);
            padding-bottom: 30px;
          }
          .filter-sidebar > div {
            position: relative !important;
            top: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .filter-sidebar { padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}
