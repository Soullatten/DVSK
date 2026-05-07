import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Copy,
  ExternalLink,
  XCircle,
  Loader2,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ordersApi, type OrderSummary, type OrderStatus } from "../api/orders";
import { connectLiveFeed } from "../lib/liveSocket";
import fallbackImage from "../assets/image6.png";

// ─── Status timeline configuration ──────────────────────────────────────────
// The 6 stages a normal order moves through. CANCELLED / RETURNED / REFUNDED
// are terminal states displayed separately, not as part of this happy-path.
type TimelineStage = {
  key: OrderStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
};

const TIMELINE: TimelineStage[] = [
  { key: "PENDING",          label: "Order Placed",      description: "We've received your order and are getting it ready.", icon: ShoppingBag },
  { key: "CONFIRMED",        label: "Confirmed",         description: "Payment confirmed. Stock reserved.",                  icon: CheckCircle2 },
  { key: "PROCESSING",       label: "Being Prepared",    description: "Your pieces are being packed with care.",             icon: Package },
  { key: "SHIPPED",          label: "Shipped",           description: "Handed to the courier — on its way to you.",          icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery",  description: "Out with the rider — arriving today.",                icon: MapPin },
  { key: "DELIVERED",        label: "Delivered",         description: "Enjoy your DVSK piece.",                              icon: CheckCircle2 },
];

const TERMINAL_STATUSES: Record<string, { label: string; color: string; description: string }> = {
  CANCELLED: { label: "Cancelled", color: "#fca5a5", description: "This order was cancelled." },
  RETURNED:  { label: "Returned",  color: "#fca5a5", description: "This order was returned." },
  REFUNDED:  { label: "Refunded",  color: "#a78bfa", description: "This order was refunded." },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatINR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Best-effort tracking URL builder for the major Indian + international
// couriers, so the customer can deep-link to the courier's tracking page.
function buildTrackingUrl(carrier: string, trackingNumber: string): string | null {
  if (!carrier || !trackingNumber) return null;
  const c = carrier.toLowerCase();
  const t = encodeURIComponent(trackingNumber.trim());
  if (c.includes("bluedart"))    return `https://www.bluedart.com/tracking?awbNo=${t}`;
  if (c.includes("delhivery"))   return `https://www.delhivery.com/track-v2/package/${t}`;
  if (c.includes("dtdc"))        return `https://www.dtdc.in/tracking/tracking_results.asp?GO=Track&Type=awb&strCnno=${t}`;
  if (c.includes("ecom"))        return `https://ecomexpress.in/tracking/?awb_field=${t}`;
  if (c.includes("shadowfax"))   return `https://shadowfax.in/tracking/${t}`;
  if (c.includes("xpressbees"))  return `https://www.xpressbees.com/track?trackid=${t}`;
  if (c.includes("india post") || c.includes("post"))
                                 return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?TrackingNo=${t}`;
  if (c.includes("fedex"))       return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  if (c.includes("dhl"))         return `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${t}`;
  if (c.includes("ups"))         return `https://www.ups.com/track?tracknum=${t}`;
  if (c.includes("aramex"))      return `https://www.aramex.com/in/en/track/results?ShipmentNumber=${t}`;
  return null;
}

// Estimate delivery date based on current status. Pure heuristic — once the
// admin starts populating real ETAs this is replaced.
//   Placed/Confirmed → ~7 working days from createdAt
//   Processing       → ~5 working days from createdAt
//   Shipped          → ~3 working days from now
//   Out for Delivery → today
function estimateDelivery(order: OrderSummary): Date | null {
  if (order.status === "DELIVERED") return null;
  if (order.status === "OUT_FOR_DELIVERY") return new Date();
  const created = new Date(order.createdAt);
  const offsets: Partial<Record<OrderStatus, number>> = {
    PENDING: 7,
    CONFIRMED: 6,
    PROCESSING: 5,
    SHIPPED: 3,
  };
  const days = offsets[order.status];
  if (!days) return null;
  const eta = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
  return eta;
}

// Indexes the active stage in the TIMELINE so we can mark earlier stages
// "complete", the matching one "current", and later ones "future".
function activeStageIndex(status: OrderStatus): number {
  const i = TIMELINE.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const refetch = async () => {
    if (!id) return;
    try {
      const fresh = await ordersApi.getById(id);
      setOrder(fresh);
    } catch (err: any) {
      // If a refetch fails we keep the existing data on screen — no banner
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await ordersApi.getById(id);
        if (!cancelled) setOrder(o);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 401) { navigate("/account"); return; }
        if (err?.response?.status === 404) {
          setError("We couldn't find this order. It may have been cancelled, or you don't have access.");
          return;
        }
        setError(err?.response?.data?.error?.message || err?.message || "Couldn't load this order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  // Live updates — when admin updates this order's status / tracking from
  // the admin panel, the storefront timeline updates without refresh.
  const socketRef = useRef<any>(null);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const sock = await connectLiveFeed();
        if (cancelled) return;
        socketRef.current = sock;

        const refetchIfMine = (payload: any) => {
          if (payload?.orderId === id || payload?.orderNumber === order?.orderNumber) {
            refetch();
          }
        };
        sock.on("order:status:updated", refetchIfMine);
        sock.on("order:tracking:updated", refetchIfMine);
      } catch {
        // Socket unavailable — page still works, just no live push
      }
    })();
    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("order:status:updated");
        socketRef.current.off("order:tracking:updated");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order?.orderNumber]);

  const stageIndex = order ? activeStageIndex(order.status) : 0;
  const eta = useMemo(() => (order ? estimateDelivery(order) : null), [order]);
  const isTerminal = order && TERMINAL_STATUSES[order.status];
  const isDelivered = order?.status === "DELIVERED";
  const trackingUrl = order ? buildTrackingUrl(order.shippingProvider || "", order.trackingNumber || "") : null;
  const itemCount = order?.items?.reduce((s, it) => s + it.quantity, 0) || 0;

  // Lightweight inline toast — storefront doesn't ship react-hot-toast,
  // and we don't want to add a dep just for one component. State-driven
  // banner at the top-right that auto-dismisses after 3 seconds.
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  const flash = (kind: "success" | "error", msg: string) => {
    setToast({ kind, msg });
    window.setTimeout(() => setToast(null), 3000);
  };

  const copyTracking = async () => {
    if (!order?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      flash("success", "Tracking number copied");
    } catch {
      flash("error", "Couldn't copy");
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("Cancel this order? This can't be undone.")) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(order.id);
      flash("success", "Order cancelled");
      refetch();
    } catch (err: any) {
      flash("error", err?.response?.data?.error?.message || "Couldn't cancel — please contact support.");
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#040404", minHeight: "100vh", color: "#fff", fontFamily: "'Jost', sans-serif" }}>
      <Navbar />

      {/* Inline flash toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: "fixed", top: 90, right: 24, zIndex: 9999,
              padding: "12px 18px",
              background: toast.kind === "success" ? "rgba(52,211,153,0.12)" : "rgba(252,165,165,0.12)",
              border: `1px solid ${toast.kind === "success" ? "rgba(52,211,153,0.4)" : "rgba(252,165,165,0.4)"}`,
              color: toast.kind === "success" ? "#34d399" : "#fca5a5",
              fontSize: 12, letterSpacing: "0.05em", fontWeight: 600,
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 24px 80px" }}>
        <button
          onClick={() => navigate("/orders")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "transparent", border: 0, color: "rgba(255,255,255,0.5)",
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: "pointer", marginBottom: 32, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> All Orders
        </button>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)" }}>
            <Loader2 size={20} className="animate-spin" style={{ marginRight: 12 }} /> Loading your order…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 40, textAlign: "center", border: "1px solid rgba(252,165,165,0.25)", background: "rgba(252,165,165,0.04)" }}>
            <p style={{ color: "#fca5a5", fontSize: 13 }}>{error}</p>
          </div>
        )}

        {!loading && !error && order && (
          <>
            {/* ── DELIVERED HERO ── shown only when status === DELIVERED.
                Replaces the standard hero with a celebratory full-bleed
                moment: animated cream seal + checkmark + particle burst,
                personalized thank-you, delivery date, and review CTAs. */}
            {isDelivered ? (
              <DeliveredHero order={order} itemCount={itemCount} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: 48 }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                  <h1 style={{
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                    fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 300,
                    margin: 0, lineHeight: 1.1,
                  }}>
                    Order
                  </h1>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", color: "#ffebab",
                    fontSize: 16, letterSpacing: "0.1em",
                  }}>
                    #{order.orderNumber}
                  </span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
                  Placed {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"} · {formatINR(order.total)}
                </p>
              </motion.div>
            )}

            {/* ── TERMINAL STATE BANNER (only for cancelled/returned/refunded) ── */}
            {isTerminal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  padding: "16px 20px", marginBottom: 32,
                  background: "rgba(252,165,165,0.05)",
                  border: "1px solid rgba(252,165,165,0.2)",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <XCircle size={18} color={isTerminal.color} />
                <div>
                  <div style={{ color: isTerminal.color, fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                    {isTerminal.label}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 }}>
                    {isTerminal.description}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ETA BANNER (active orders only — not delivered/terminal) ── */}
            {!isTerminal && !isDelivered && eta && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  padding: "20px 24px", marginBottom: 40,
                  background: "linear-gradient(90deg, rgba(255,235,171,0.07) 0%, rgba(255,235,171,0.02) 100%)",
                  border: "1px solid rgba(255,235,171,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Truck size={22} color="#ffebab" strokeWidth={1.5} />
                  <div>
                    <div style={{ color: "rgba(255,235,171,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                      {order.status === "DELIVERED" ? "Delivered" : "Estimated Delivery"}
                    </div>
                    <div style={{
                      color: "#ffebab", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                      fontSize: 22, fontWeight: 300, marginTop: 2,
                    }}>
                      {eta.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MAIN GRID ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 360px)",
              gap: 32,
            }} className="ord-track-grid">
              {/* LEFT COL — TIMELINE + ITEMS */}
              <div>
                {/* Timeline — hidden once delivered (replaced by hero) or terminal */}
                {!isTerminal && !isDelivered && (
                  <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 24px", fontWeight: 700 }}>
                      Status Timeline
                    </h2>

                    <ol style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
                      {TIMELINE.map((stage, i) => {
                        const isComplete = i < stageIndex;
                        const isCurrent = i === stageIndex;
                        const isFuture = i > stageIndex;
                        const Icon = stage.icon;
                        return (
                          <motion.li
                            key={stage.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 * i }}
                            style={{
                              display: "grid", gridTemplateColumns: "32px 1fr",
                              gap: 18, paddingBottom: i === TIMELINE.length - 1 ? 0 : 28, position: "relative",
                            }}
                          >
                            {/* Connecting line */}
                            {i < TIMELINE.length - 1 && (
                              <div style={{
                                position: "absolute", left: 15, top: 32, bottom: -4,
                                width: 1.5,
                                background: isComplete ? "rgba(255,235,171,0.4)" : "rgba(255,255,255,0.06)",
                                transition: "background 0.3s",
                              }} />
                            )}
                            {/* Dot */}
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: isComplete || isCurrent ? "rgba(255,235,171,0.12)" : "transparent",
                              border: `1.5px solid ${isComplete || isCurrent ? "rgba(255,235,171,0.6)" : "rgba(255,255,255,0.12)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              position: "relative", zIndex: 1,
                            }}>
                              {isCurrent && (
                                <motion.span
                                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  style={{
                                    position: "absolute", inset: -2, borderRadius: "50%",
                                    border: "1.5px solid #ffebab",
                                  }}
                                />
                              )}
                              <Icon
                                size={14}
                                strokeWidth={1.8}
                                className=""
                              />
                            </div>
                            {/* Label */}
                            <div style={{ paddingTop: 4 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 600,
                                color: isFuture ? "rgba(255,255,255,0.35)" : "#fff",
                                marginBottom: 4,
                              }}>
                                {stage.label}
                              </div>
                              <div style={{
                                fontSize: 12,
                                color: isFuture ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
                                lineHeight: 1.55,
                              }}>
                                {stage.description}
                              </div>
                              {isCurrent && (
                                <div style={{
                                  fontSize: 10, color: "#ffebab", letterSpacing: "0.22em",
                                  textTransform: "uppercase", marginTop: 8, fontWeight: 700,
                                }}>
                                  Current step
                                </div>
                              )}
                            </div>
                          </motion.li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {/* Items list */}
                <div style={{ marginBottom: 48 }}>
                  <h2 style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 24px", fontWeight: 700 }}>
                    Items in this order
                  </h2>
                  <div style={{ display: "grid", gap: 14 }}>
                    {order.items?.map((item) => (
                      <div key={item.id} style={{
                        display: "grid", gridTemplateColumns: "70px 1fr auto",
                        gap: 16, alignItems: "center",
                        padding: 14, background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <img
                          src={item.image || fallbackImage}
                          alt={item.productName}
                          style={{ width: 70, height: 86, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImage; }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                            Size {item.size} · {item.color} · Qty {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#ffebab" }}>
                          {formatINR(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COL — SHIPPING + TOTALS */}
              <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
                {/* Shipping address */}
                {order.address && (
                  <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <MapPin size={14} color="rgba(255,235,171,0.7)" strokeWidth={1.5} />
                      <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                        Shipping to
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 6 }}>
                      {order.address.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                      {order.address.addressLine1}
                      {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}<br />
                      {order.address.city}, {order.address.state} {order.address.pincode}<br />
                      {order.address.country || "India"}
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6 }}>
                      {order.address.phone && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone size={11} /> {order.address.phone}
                        </div>
                      )}
                      {order.address.email && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Mail size={11} /> {order.address.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tracking info */}
                {(order.shippingProvider || order.trackingNumber) && (
                  <div style={{ padding: 20, background: "linear-gradient(180deg, rgba(255,235,171,0.06) 0%, rgba(255,235,171,0.02) 100%)", border: "1px solid rgba(255,235,171,0.25)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Truck size={14} color="#ffebab" strokeWidth={1.5} />
                      <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffebab", fontWeight: 700 }}>
                        Shipped via
                      </span>
                    </div>
                    {order.shippingProvider && (
                      <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, marginBottom: 10 }}>
                        {order.shippingProvider}
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: trackingUrl ? 12 : 0 }}>
                        <code style={{
                          flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
                          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {order.trackingNumber}
                        </code>
                        <button
                          onClick={copyTracking}
                          style={{
                            padding: "8px 10px", background: "rgba(255,235,171,0.1)",
                            border: "1px solid rgba(255,235,171,0.3)", color: "#ffebab",
                            cursor: "pointer", display: "inline-flex", alignItems: "center",
                          }}
                          title="Copy tracking number"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    )}
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          fontSize: 11, color: "#ffebab", textDecoration: "none",
                          padding: "8px 14px", background: "rgba(255,235,171,0.08)",
                          border: "1px solid rgba(255,235,171,0.3)",
                          letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600,
                        }}
                      >
                        Track on {order.shippingProvider} <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div style={{ padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 14, fontWeight: 700 }}>
                    Order Summary
                  </div>
                  {[
                    ["Subtotal", order.subtotal],
                    ["Shipping", order.shippingCost],
                    Number(order.discount) > 0 ? ["Discount", `-${formatINR(order.discount)}`] : null,
                    ["Tax (GST)", order.tax],
                  ].filter(Boolean).map((row: any) => (
                    <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "6px 0" }}>
                      <span>{row[0]}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {typeof row[1] === "string" ? row[1] : formatINR(row[1])}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: "#ffebab", fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatINR(order.total)}
                    </span>
                  </div>
                </div>

                {/* Cancel button — only for early-stage orders */}
                {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{
                      padding: "12px 16px", background: "transparent",
                      border: "1px solid rgba(252,165,165,0.3)",
                      color: cancelling ? "rgba(252,165,165,0.4)" : "#fca5a5",
                      cursor: cancelling ? "not-allowed" : "pointer",
                      fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {cancelling ? <><Loader2 size={13} className="animate-spin" /> Cancelling…</> : <><XCircle size={13} /> Cancel Order</>}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />

      <style>{`
        @media (max-width: 800px) {
          .ord-track-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DELIVERED HERO
// Full-bleed celebratory hero shown when an order's status is DELIVERED.
// Replaces the standard tracking timeline with a "you got it" moment —
// animated cream seal, particle burst, personalized thank-you, and CTAs.
// ═══════════════════════════════════════════════════════════════════════════
function DeliveredHero({ order, itemCount }: { order: OrderSummary; itemCount: number }) {
  const navigate = useNavigate();
  const PARTICLES = 16;
  const deliveredDate = new Date(order.updatedAt || order.createdAt);
  const today = new Date();
  const isToday =
    deliveredDate.getFullYear() === today.getFullYear() &&
    deliveredDate.getMonth() === today.getMonth() &&
    deliveredDate.getDate() === today.getDate();
  const deliveredLabel = isToday
    ? "Delivered today"
    : `Delivered ${deliveredDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`;

  return (
    <div
      style={{
        position: "relative",
        marginBottom: 56,
        padding: "56px 32px 64px",
        textAlign: "center",
        background: "linear-gradient(180deg, rgba(52,211,153,0.04) 0%, rgba(255,235,171,0.04) 50%, transparent 100%)",
        border: "1px solid rgba(255,235,171,0.15)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Soft radial glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,235,171,0.12) 0%, rgba(52,211,153,0.04) 30%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Seal */}
      <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto 28px" }}>
        {/* Halo pulse */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 2.6, opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.8, delay: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid rgba(52,211,153,0.5)",
            pointerEvents: "none",
          }}
        />
        {/* Particle burst — alternating cream + emerald */}
        {Array.from({ length: PARTICLES }).map((_, i) => {
          const angle = (i / PARTICLES) * Math.PI * 2;
          const dist = 90;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0.4],
              }}
              transition={{
                duration: 1.4,
                delay: 0.5 + (i % 4) * 0.04,
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
                background: i % 2 === 0 ? "#ffebab" : "#34d399",
                boxShadow: i % 2 === 0 ? "0 0 8px rgba(255,235,171,0.7)" : "0 0 8px rgba(52,211,153,0.7)",
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* SVG ring + checkmark */}
        <svg viewBox="0 0 100 100" width="132" height="132" style={{ position: "relative", zIndex: 2 }}>
          <motion.circle
            cx="50"
            cy="50"
            r="48"
            stroke="rgba(52,211,153,0.18)"
            strokeWidth="0.5"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="#34d399"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            transform="rotate(-90 50 50)"
          />
          <motion.path
            d="M 32 51 L 45 64 L 70 38"
            stroke="#34d399"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </svg>
      </div>

      {/* "Delivered" status pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 14px",
          marginBottom: 18,
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.4)",
          borderRadius: 999,
          color: "#34d399",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        <CheckCircle2 size={11} />
        {deliveredLabel}
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "clamp(2.4rem, 6vw, 4rem)",
          fontWeight: 300,
          margin: "0 0 14px",
          lineHeight: 1.1,
          color: "#fff",
        }}
      >
        Your DVSK has arrived.
      </motion.h1>

      {/* Sub-line */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.25 }}
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 14,
          margin: "0 auto 28px",
          maxWidth: 480,
          fontWeight: 300,
          lineHeight: 1.6,
        }}
      >
        Hand-finished, pressed, packed — and now in your hands. Wear it like you mean it.
      </motion.p>

      {/* Order pill */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.35 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 20px",
          marginBottom: 32,
          border: "1px solid rgba(255,235,171,0.25)",
          borderRadius: 999,
          background: "rgba(255,235,171,0.04)",
        }}
      >
        <span style={{ color: "rgba(255,235,171,0.55)", fontSize: 10, letterSpacing: "0.22em", fontWeight: 600, textTransform: "uppercase" }}>
          Order
        </span>
        <span style={{
          color: "#ffebab",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}>
          #{order.orderNumber}
        </span>
        <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          {itemCount} {itemCount === 1 ? "piece" : "pieces"}
        </span>
        <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {formatINR(order.total)}
        </span>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
      >
        <button
          onClick={() => navigate("/men")}
          style={{
            padding: "14px 28px",
            background: "#ffebab",
            color: "#000",
            border: "1px solid #ffebab",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ffe199"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffebab"; }}
        >
          Shop the Drop
        </button>
        <button
          onClick={() => navigate("/orders")}
          style={{
            padding: "14px 28px",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,235,171,0.4)";
            e.currentTarget.style.color = "#ffebab";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          }}
        >
          All Orders
        </button>
      </motion.div>
    </div>
  );
}
