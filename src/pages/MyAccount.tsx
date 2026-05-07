import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  TrendingUp,
  MapPin,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Loader2,
  Heart,
  Settings,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ordersApi, type OrderSummary } from "../api/orders";
import { authApi } from "../api/auth";

const formatINR = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Status color config — same palette as the tracking page
const STATUS_DISPLAY: Record<string, { label: string; tone: string; bg: string }> = {
  PENDING:          { label: "Pending",          tone: "#ffd166", bg: "rgba(255,209,102,0.08)" },
  CONFIRMED:        { label: "Confirmed",        tone: "#7dd3fc", bg: "rgba(125,211,252,0.08)" },
  PROCESSING:       { label: "Processing",       tone: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  SHIPPED:          { label: "Shipped",          tone: "#ffebab", bg: "rgba(255,235,171,0.1)"  },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", tone: "#fbbf24", bg: "rgba(251,191,36,0.1)"   },
  DELIVERED:        { label: "Delivered",        tone: "#34d399", bg: "rgba(52,211,153,0.08)"  },
  CANCELLED:        { label: "Cancelled",        tone: "#fca5a5", bg: "rgba(252,165,165,0.06)" },
};

// Hash the user's name to a deterministic gradient — same person always
// gets the same avatar tint across pages.
const avatarGradients = [
  "linear-gradient(135deg, #ffebab 0%, #d4b572 100%)",
  "linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
  "linear-gradient(135deg, #34d399 0%, #047857 100%)",
  "linear-gradient(135deg, #f472b6 0%, #be185d 100%)",
];
const gradientFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return avatarGradients[Math.abs(h) % avatarGradients.length];
};

const initials = (name?: string | null) =>
  (name || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function MyAccount() {
  const navigate = useNavigate();

  // Live Firebase auth state — bounce to login if not signed in
  const [authReady, setAuthReady] = useState(false);
  const [fbUser, setFbUser] = useState(auth.currentUser);

  // Backend profile + orders for the dashboard
  const [profile, setProfile] = useState<{ name?: string | null; email?: string | null; phone?: string | null; avatar?: string | null; addresses?: any[]; createdAt?: string } | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setAuthReady(true);
      if (!u) {
        navigate("/account");
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!fbUser) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [me, ord] = await Promise.all([
          authApi.me().catch(() => null),
          ordersApi.list(1, 50).then((r) => r.orders).catch(() => []),
        ]);
        if (cancelled) return;
        setProfile(me);
        setOrders(ord || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fbUser]);

  // Lifetime stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const inFlight = orders.filter((o) =>
      ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)
    ).length;
    return { totalOrders, totalSpent, delivered, inFlight };
  }, [orders]);

  const recentOrders = orders.slice(0, 4);

  const displayName =
    profile?.name ||
    fbUser?.displayName ||
    (profile?.email || fbUser?.email)?.split("@")[0] ||
    "there";
  const displayEmail = profile?.email || fbUser?.email || "";
  const displayPhone = profile?.phone || fbUser?.phoneNumber || "";
  const joinedAt = profile?.createdAt
    ? new Date(profile.createdAt)
    : fbUser?.metadata?.creationTime
    ? new Date(fbUser.metadata.creationTime)
    : null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("dvsk_auth_token");
      navigate("/home");
    } catch {
      // ignore
    }
  };

  // Loading skeleton — keep the navbar visible so this doesn't feel like a flash
  if (!authReady || loading) {
    return (
      <div style={{ background: "#040404", minHeight: "100vh", color: "#fff", fontFamily: "'Jost', sans-serif" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "200px 0", color: "rgba(255,255,255,0.4)" }}>
          <Loader2 size={20} className="animate-spin" style={{ marginRight: 12 }} /> Loading your account…
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#040404", minHeight: "100vh", color: "#fff", fontFamily: "'Jost', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 24px 80px" }}>
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

        {/* ── HERO PROFILE CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative",
            padding: "40px 36px",
            marginBottom: 40,
            background: "linear-gradient(135deg, rgba(255,235,171,0.05) 0%, rgba(255,235,171,0.01) 100%)",
            border: "1px solid rgba(255,235,171,0.18)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Subtle radial glow top-right */}
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -80,
              width: 280,
              height: 280,
              background: "radial-gradient(circle, rgba(255,235,171,0.08) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", position: "relative" }}>
            {/* Avatar */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: gradientFor(displayName + displayEmail),
                color: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {initials(displayName)}
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700,
                  color: "rgba(255,235,171,0.6)",
                }}>
                  Account
                </span>
                {joinedAt && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={9} /> Joined {joinedAt.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                fontWeight: 300,
                margin: 0,
                lineHeight: 1.05,
                color: "#fff",
                marginBottom: 12,
              }}>
                Hi, {displayName.split(" ")[0]}.
              </h1>

              {/* Contact chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {displayEmail && (
                  <ContactChip icon={<Mail size={11} />} label={displayEmail} />
                )}
                {displayPhone && (
                  <ContactChip icon={<Phone size={11} />} label={displayPhone} />
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "1px solid rgba(252,165,165,0.25)",
                color: "rgba(252,165,165,0.85)",
                cursor: "pointer",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(252,165,165,0.06)";
                e.currentTarget.style.borderColor = "rgba(252,165,165,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(252,165,165,0.25)";
              }}
            >
              <LogOut size={12} /> Log Out
            </button>
          </div>
        </motion.div>

        {/* ── STATS GRID ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 40,
        }}>
          <StatCard
            label="Total Orders"
            value={stats.totalOrders.toString()}
            icon={<ShoppingBag size={14} />}
            tone="#ffebab"
            delay={0}
          />
          <StatCard
            label="Lifetime Spend"
            value={formatINR(stats.totalSpent)}
            icon={<TrendingUp size={14} />}
            tone="#a78bfa"
            delay={0.05}
          />
          <StatCard
            label="In Flight"
            value={stats.inFlight.toString()}
            icon={<Loader2 size={14} />}
            tone="#7dd3fc"
            delay={0.1}
          />
          <StatCard
            label="Delivered"
            value={stats.delivered.toString()}
            icon={<MapPin size={14} />}
            tone="#34d399"
            delay={0.15}
          />
        </div>

        {/* ── MAIN GRID ── */}
        <div
          className="ma-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)",
            gap: 32,
          }}
        >
          {/* LEFT — Recent orders + saved addresses */}
          <div>
            {/* Recent orders */}
            <SectionHeader
              title="Recent Orders"
              cta={orders.length > 4 ? { label: "View all", onClick: () => navigate("/orders") } : undefined}
            />
            {recentOrders.length === 0 ? (
              <div style={{
                padding: "44px 24px", textAlign: "center",
                border: "1px dashed rgba(255,255,255,0.1)", marginBottom: 36,
              }}>
                <ShoppingBag size={28} color="rgba(255,235,171,0.3)" strokeWidth={1.2} style={{ marginBottom: 14 }} />
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 16px" }}>
                  No orders yet. When you place one, it'll show here.
                </p>
                <button
                  onClick={() => navigate("/men")}
                  style={{
                    padding: "12px 28px", background: "#ffebab", color: "#000",
                    border: 0, cursor: "pointer", fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginBottom: 36 }}>
                {recentOrders.map((o, i) => {
                  const cfg = STATUS_DISPLAY[o.status] || STATUS_DISPLAY.PENDING;
                  const itemCount = o.items?.reduce((s, it) => s + it.quantity, 0) || 0;
                  return (
                    <motion.button
                      key={o.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="ma-order-card"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        alignItems: "center",
                        gap: 16,
                        padding: 16,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        color: "#fff",
                        textAlign: "left",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {/* Status pill column */}
                      <span
                        style={{
                          padding: "4px 10px",
                          background: cfg.bg,
                          color: cfg.tone,
                          border: `1px solid ${cfg.tone}30`,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cfg.label}
                      </span>

                      {/* Order details */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>
                          Order #{o.orderNumber}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                          {formatDate(o.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"} · {formatINR(o.total)}
                        </div>
                      </div>

                      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Saved addresses */}
            <SectionHeader title="Saved Addresses" />
            {!profile?.addresses || profile.addresses.length === 0 ? (
              <div style={{
                padding: "32px 20px", textAlign: "center",
                border: "1px dashed rgba(255,255,255,0.08)",
              }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
                  You'll save addresses as you place orders. They'll show up here for quick reuse.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {profile.addresses.slice(0, 3).map((a: any) => (
                  <div
                    key={a.id || a.addressLine1}
                    style={{
                      padding: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <MapPin size={11} color="rgba(255,235,171,0.6)" />
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>
                        {a.label || a.fullName || "Address"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, paddingLeft: 19 }}>
                      {a.addressLine1}
                      {a.addressLine2 ? `, ${a.addressLine2}` : ""}<br />
                      {a.city}, {a.state} {a.pincode}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Quick links */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <QuickLink
              icon={<ShoppingBag size={14} color="#ffebab" />}
              label="My Orders"
              hint="Track every shipment"
              onClick={() => navigate("/orders")}
            />
            <QuickLink
              icon={<Heart size={14} color="#fca5a5" />}
              label="Wishlist"
              hint="Saved for later"
              onClick={() => navigate("/")}
            />
            <QuickLink
              icon={<UserIcon size={14} color="#7dd3fc" />}
              label="Profile Details"
              hint="Update your info"
              onClick={() => alert("Profile editing coming soon — for now contact support@dvsk.shop to update.")}
            />
            <QuickLink
              icon={<Settings size={14} color="#a78bfa" />}
              label="Email Preferences"
              hint="Drop alerts, order updates"
              onClick={() => alert("Email preferences coming soon.")}
            />

            {/* Need help block */}
            <div
              style={{
                padding: 18,
                marginTop: 6,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                Need Help?
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, margin: "0 0 12px" }}>
                Reach out for anything — sizing, returns, or just to chat about a fit.
              </p>
              <a
                href="mailto:support@dvsk.shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#ffebab",
                  textDecoration: "none",
                  letterSpacing: "0.1em",
                }}
              >
                <Mail size={11} /> support@dvsk.shop
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .ma-order-card:hover {
          background: rgba(255,235,171,0.04) !important;
          border-color: rgba(255,235,171,0.2) !important;
        }
        @media (max-width: 800px) {
          .ma-grid { grid-template-columns: 1fr !important; }
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

// ─── Subcomponents ─────────────────────────────────────────────────────────
function ContactChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999,
      fontSize: 11, color: "rgba(255,255,255,0.7)",
    }}>
      <span style={{ color: "rgba(255,235,171,0.6)" }}>{icon}</span>
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        position: "relative",
        padding: 20,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, ${tone} 0%, transparent 70%)`,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
          color: tone,
        }}>
          {label}
        </span>
        <span style={{ color: tone, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </motion.div>
  );
}

function SectionHeader({
  title,
  cta,
}: {
  title: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 14,
    }}>
      <h2 style={{
        fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 700,
      }}>
        {title}
      </h2>
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            background: "transparent", border: 0, color: "rgba(255,235,171,0.7)",
            fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", fontWeight: 500,
            padding: 0,
          }}
        >
          {cta.label} →
        </button>
      )}
    </div>
  );
}

function QuickLink({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.25s",
        color: "#fff",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,235,171,0.04)";
        e.currentTarget.style.borderColor = "rgba(255,235,171,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: "rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>
          {hint}
        </div>
      </div>
      <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
    </button>
  );
}
