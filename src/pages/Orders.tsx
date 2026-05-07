import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Package, ArrowLeft, ShoppingBag } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ordersApi, type OrderSummary, type OrderStatus } from "../api/orders";
import fallbackImage from "../assets/image6.png";

// ─── Status → display config ───────────────────────────────────────────────
// Each status maps to a label, a color (matches DVSK's cream/black palette),
// and a short progress descriptor for the list card.
const STATUS_DISPLAY: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING:          { label: "Awaiting Confirmation", color: "#ffd166",   bg: "rgba(255,209,102,0.08)", border: "rgba(255,209,102,0.3)" },
  CONFIRMED:        { label: "Confirmed",             color: "#7dd3fc",   bg: "rgba(125,211,252,0.08)", border: "rgba(125,211,252,0.3)" },
  PROCESSING:       { label: "Being Prepared",        color: "#a78bfa",   bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)" },
  SHIPPED:          { label: "Shipped",               color: "#ffebab",   bg: "rgba(255,235,171,0.1)",  border: "rgba(255,235,171,0.4)" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",      color: "#fbbf24",   bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.45)" },
  DELIVERED:        { label: "Delivered",             color: "#34d399",   bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.35)" },
  CANCELLED:        { label: "Cancelled",             color: "#fca5a5",   bg: "rgba(252,165,165,0.06)", border: "rgba(252,165,165,0.25)" },
  RETURNED:         { label: "Returned",              color: "#fca5a5",   bg: "rgba(252,165,165,0.06)", border: "rgba(252,165,165,0.25)" },
  REFUNDED:         { label: "Refunded",              color: "#fca5a5",   bg: "rgba(252,165,165,0.06)", border: "rgba(252,165,165,0.25)" },
};

const formatINR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ordersApi.list(1, 50);
        if (!cancelled) setOrders(result.orders || []);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          // Not logged in → bounce to account
          navigate("/account");
          return;
        }
        setError(err?.response?.data?.error?.message || err?.message || "Couldn't load your orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div style={{ background: "#040404", minHeight: "100vh", color: "#fff", fontFamily: "'Jost', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "120px 24px 80px" }}>
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "transparent", border: 0, color: "rgba(255,255,255,0.5)",
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: "pointer", marginBottom: 32, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        {/* Title */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 300, margin: 0,
            lineHeight: 1.1,
          }}>
            Your Orders
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8, letterSpacing: "0.05em" }}>
            Every piece you've called in. Live status updates as soon as we ship.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "grid", gap: 14 }}>
            {[1, 2, 3].map((k) => (
              <div key={k} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                padding: 24, height: 130, borderRadius: 4,
              }}>
                <div style={{
                  width: "30%", height: 16, background: "rgba(255,255,255,0.05)",
                  borderRadius: 3, marginBottom: 14,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <div style={{
                  width: "60%", height: 12, background: "rgba(255,255,255,0.04)",
                  borderRadius: 3, animation: "pulse 1.5s ease-in-out infinite",
                }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            padding: 40, textAlign: "center",
            border: "1px solid rgba(252,165,165,0.25)", background: "rgba(252,165,165,0.04)",
          }}>
            <p style={{ color: "#fca5a5", fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div style={{
            padding: "80px 24px", textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}>
            <ShoppingBag size={36} color="rgba(255,235,171,0.4)" strokeWidth={1.2} style={{ marginBottom: 18 }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 24, fontWeight: 300, margin: 0 }}>
              No orders yet
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "10px 0 28px" }}>
              When you place your first order, it'll show up here with live tracking.
            </p>
            <button
              onClick={() => navigate("/men")}
              style={{
                padding: "14px 32px", background: "#ffebab", color: "#000",
                border: 0, cursor: "pointer", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
              }}
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && orders.length > 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            {orders.map((order, i) => {
              const cfg = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.PENDING;
              const itemCount = order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;
              const firstImage = order.items?.[0]?.image || fallbackImage;
              return (
                <motion.button
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 18,
                    padding: 18, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", color: "#fff", textAlign: "left",
                    transition: "all 0.25s ease", alignItems: "center",
                  }}
                  className="ord-card"
                >
                  {/* Thumbnail stack */}
                  <div style={{ position: "relative", width: 56, height: 70, flexShrink: 0 }}>
                    <img src={firstImage} alt="" style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }} />
                    {itemCount > 1 && (
                      <span style={{
                        position: "absolute", bottom: -6, right: -6,
                        background: "#ffebab", color: "#000",
                        fontSize: 9, fontWeight: 700, padding: "2px 6px",
                        borderRadius: 99,
                      }}>
                        +{itemCount - 1}
                      </span>
                    )}
                  </div>

                  {/* Order details */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      display: "inline-block", padding: "4px 10px",
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      color: cfg.color, fontSize: 10, fontWeight: 600,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      marginBottom: 8,
                    }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      Order #{order.orderNumber}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                      {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"} · {formatINR(order.total)}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .ord-card:hover {
          background: rgba(255,235,171,0.04) !important;
          border-color: rgba(255,235,171,0.2) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
