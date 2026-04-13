import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ChevronDown, Plus, Minus, Star, ArrowRight, Loader2, Check } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { productsApi } from "../api/products";
import type { Product } from "../api/types";

import fallbackImage from '../assets/image6.png';

export default function ProductDetail() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ["start center", "end center"]
  });
  const indicatorHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("details");
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const { addItem } = useCart();
  const { isWishlisted, addItem: addWishlistItem, removeItem: removeWishlistItem } = useWishlist();
  const numericId = parseInt(slug || '1', 10);
  const isSaved = isWishlisted(numericId);

  const [reviewText, setReviewText] = useState("");

  // Fetch product from API
  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await productsApi.getProductBySlug(slug);
        setProduct(data);
        // Auto-select first available color
        if (data.variants?.length) {
          const colors = [...new Set(data.variants.map(v => v.color))];
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

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
  }, [slug]);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  // Derived data from product
  const images = product?.images?.length ? product.images.map(img => img.url) : [fallbackImage];
  const price = product ? Number(product.salePrice || product.basePrice) : 0;
  const originalPrice = product ? Number(product.basePrice) : 0;
  const hasSale = product?.salePrice && Number(product.salePrice) < originalPrice;

  // Get unique sizes and colors from variants
  const availableSizes = product?.variants
    ? [...new Set(product.variants.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))]
    : [];
  const availableColors = product?.variants
    ? [...new Set(product.variants.map(v => v.color))]
    : [];

  // Find the selected variant
  const selectedVariant = product?.variants?.find(
    v => v.size === selectedSize && v.color === selectedColor
  );

  const handleAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (!selectedVariant) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    setAddedToCart(true);

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variant: `${selectedColor} / ${selectedSize}`,
      price: Number(selectedVariant.priceOverride || product.salePrice || product.basePrice),
      image: product.images?.[0]?.url || fallbackImage,
      slug: product.slug,
    }, qty);

    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Reviews from API response
  const reviews = (product as any)?.reviews || [];
  const reviewCount = product?._count?.reviews || reviews.length;

  if (loading) {
    return (
      <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <Navbar />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={28} color="rgba(139, 43, 226, 0.6)" />
        </motion.div>
        <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading product...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ backgroundColor: "#080808", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
        <Navbar />
        <p style={{ fontSize: "14px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>{error || "Product not found"}</p>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.4)", borderRadius: "100px", padding: "12px 32px", color: "#fff", cursor: "pointer", letterSpacing: "0.2em", fontSize: "10px", textTransform: "uppercase" }}>
          GO BACK
        </button>
      </div>
    );
  }

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

          {/* Scroll Progress Bar */}
          <div style={{ position: "sticky", top: "140px", height: "60vh", width: "2px", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }} className="scroll-tracker">
            <motion.div style={{ width: "100%", background: "#fff", height: indicatorHeight }} />
          </div>

          {/* Left Column: Image Gallery */}
          <div ref={galleryRef} className="pdp-gallery" style={{ flex: "1.5", minWidth: "400px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {images.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ width: "100%", background: "#111", overflow: "hidden", position: "relative" }}
              >
                <img
                  src={img}
                  style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                  alt={`${product.name} - angle ${idx + 1}`}
                  onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                />
                <div style={{ position: "absolute", bottom: "20px", left: "20px", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", fontFamily: "'Jost', sans-serif" }}>
                  0{idx + 1} / 0{images.length}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Sticky Product Info */}
          <div className="pdp-info" style={{ flex: "1", minWidth: "350px", position: "sticky", top: "140px", paddingBottom: "40px" }}>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 300, lineHeight: 1.1, margin: 0, color: "#fff" }}>
                  {product.name}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {hasSale && (
                    <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)", textDecoration: "line-through", letterSpacing: "0.05em" }}>
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
                  <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.9)", margin: 0, letterSpacing: "0.05em", fontFamily: "'Jost', sans-serif" }}>
                    ₹{price.toLocaleString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#fff" color="#fff" />)}
                  <span style={{ fontSize: "11px", marginLeft: "6px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>({reviewCount} Reviews)</span>
                </div>
              </div>

              <div style={{ paddingBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "40px" }}>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontWeight: 300, letterSpacing: "0.02em" }}>
                  {product.description}
                </p>
              </div>

              {/* Color Selector */}
              {availableColors.length > 1 && (
                <div style={{ marginBottom: "30px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "16px", display: "block" }}>
                    Color: {selectedColor}
                  </span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {availableColors.map(color => {
                      const variant = product.variants?.find(v => v.color === color);
                      return (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setSelectedSize(null); }}
                          style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: variant?.colorHex || "#666",
                            border: selectedColor === color ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
                            cursor: "pointer", transition: "border-color 0.3s",
                            outline: selectedColor === color ? "2px solid rgba(255,255,255,0.3)" : "none",
                            outlineOffset: "3px",
                          }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Select Size</span>
                  <button onClick={() => navigate('/size-guide')} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textDecoration: "underline", transition: "color 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>Size Guide</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(availableSizes.length, 4)}, 1fr)`, gap: "12px" }}>
                  {availableSizes.map(size => {
                    const variant = product.variants?.find(v => v.size === size && v.color === selectedColor);
                    const outOfStock = variant ? variant.stock <= 0 : true;
                    return (
                      <button
                        key={size}
                        onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false); } }}
                        disabled={outOfStock}
                        style={{
                          background: "transparent",
                          color: outOfStock ? "rgba(255,255,255,0.2)" : selectedSize === size ? "#fff" : "rgba(255,255,255,0.6)",
                          border: selectedSize === size ? "1px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                          padding: "16px 0", cursor: outOfStock ? "not-allowed" : "pointer",
                          fontFamily: "'Jost', sans-serif", fontSize: "12px", letterSpacing: "0.1em",
                          transition: "all 0.3s ease", position: "relative", overflow: "hidden",
                          textDecoration: outOfStock ? "line-through" : "none",
                          opacity: outOfStock ? 0.4 : 1,
                        }}
                        className="size-btn"
                      >
                        <AnimatePresence>
                          {selectedSize === size && !outOfStock && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.3 }}
                              style={{ position: "absolute", inset: 0, background: "#fff", zIndex: -1 }} />
                          )}
                        </AnimatePresence>
                        <span style={{ position: "relative", zIndex: 2, color: selectedSize === size && !outOfStock ? "#000" : "inherit" }}>{size}</span>
                      </button>
                    );
                  })}
                </div>
                {sizeError && <p style={{ fontSize: "11px", color: "#ff4d4d", marginTop: "12px" }}>Please select a size.</p>}
                {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
                  <p style={{ fontSize: "11px", color: "#ffebab", marginTop: "8px", letterSpacing: "0.1em" }}>Only {selectedVariant.stock} left in stock</p>
                )}
              </div>

              {/* Add to Cart Controller */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "50px", height: "60px" }}>
                {/* Quantity Selector */}
                <div className="qty-selector" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.2)", width: "130px", justifyContent: "space-between", padding: "0", transition: "border-color 0.3s", height: "100%" }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="qty-btn" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", height: "100%", padding: "0 16px", opacity: qty <= 1 ? 0.3 : 1, transition: "background 0.3s" }}><Minus size={14} /></button>
                  <span style={{ fontSize: "14px", color: "#fff", fontFamily: "'Jost', sans-serif" }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="qty-btn" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", height: "100%", padding: "0 16px", transition: "background 0.3s" }}><Plus size={14} /></button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  style={{
                    flex: 1, background: addedToCart ? "#22c55e" : "#fff", color: addedToCart ? "#fff" : "#000", border: "none", height: "100%",
                    fontFamily: "'Jost', sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
                    cursor: addedToCart ? "default" : "pointer", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px"
                  }}
                  className="elegant-buy-btn"
                >
                  {addedToCart ? (
                    <>
                      <Check size={16} style={{ zIndex: 2, position: "relative" }} />
                      <span style={{ zIndex: 2, position: "relative" }}>ADDED</span>
                    </>
                  ) : (
                    <>
                      <span style={{ zIndex: 2, position: "relative" }}>ADD TO CART</span>
                      <ArrowRight size={16} className="buy-arrow" style={{ zIndex: 2, position: "relative", transition: "transform 0.4s" }} />
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => {
                    if (isSaved) {
                      removeWishlistItem(numericId);
                    } else {
                      addWishlistItem({
                        id: numericId,
                        name: product.name,
                        variant: selectedSize ? `${selectedColor || ''} / ${selectedSize}` : selectedColor || 'Default',
                        price: price,
                        image: product.images?.[0]?.url || fallbackImage
                      });
                    }
                  }}
                  style={{
                    height: "100%", width: "60px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s",
                    color: isSaved ? "#8B2BE2" : "#fff", borderColor: isSaved ? "#8B2BE2" : "rgba(255,255,255,0.2)"
                  }}
                  onMouseEnter={(e) => { if (!isSaved) { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#8B2BE2"; } }}
                  onMouseLeave={(e) => { if (!isSaved) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; } }}
                  title="Save to Vault"
                >
                  <Star fill={isSaved ? "#8B2BE2" : "none"} size={20} />
                </button>
              </div>

              {/* Tag */}
              {product.tag && (
                <div style={{ marginBottom: "30px" }}>
                  <span style={{ background: "rgba(139, 43, 226, 0.1)", border: "1px solid rgba(139, 43, 226, 0.3)", borderRadius: "100px", padding: "6px 16px", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
                    {product.tag.replace('_', ' ')}
                  </span>
                </div>
              )}

              {/* Accordions */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                {[
                  { id: "details", title: "Details & Care", content: product.shortDesc || "Premium quality materials. Dry clean recommended." },
                  { id: "shipping", title: "Shipping & Returns", content: "Free worldwide express shipping on orders over ₹5,000. Complimentary returns within 14 days of receipt." }
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
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
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

        {/* Reviews Section */}
        <div style={{ maxWidth: "800px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", fontWeight: 300, marginBottom: "40px" }}>Client Reviews</h2>

          {reviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {reviews.map((rev: any) => (
                <div key={rev.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "30px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{rev.user?.name || "Anonymous"}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                      {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
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
          ) : (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No reviews yet. Be the first to review this product.</p>
          )}

          {/* Review Submission */}
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
              onClick={() => { if (reviewText) { alert("Review submitted for moderation."); setReviewText(""); } }}
              style={{ background: "#fff", color: "#000", border: "none", padding: "12px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", transition: "transform 0.2s" }}
              className="submit-review-btn"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        .size-btn:hover:not(:disabled) {
          border-color: #fff !important;
        }
        .qty-selector:hover { border-color: rgba(255,255,255,0.5) !important; }
        .qty-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .elegant-buy-btn:hover:not(:disabled) {
          background: #e6e6e6;
        }
        .elegant-buy-btn:hover .buy-arrow {
          transform: translateX(4px);
        }
        .review-input:focus {
          border-color: rgba(255,255,255,0.4) !important;
        }
        .submit-review-btn:hover {
          transform: scale(0.98);
        }
        @media (max-width: 1024px) {
          .pdp-gallery { flex: initial !important; width: 100%; }
          .pdp-info { position: relative !important; top: 0 !important; }
          .scroll-tracker { display: none !important; }
        }
      `}</style>
    </div>
  );
}
