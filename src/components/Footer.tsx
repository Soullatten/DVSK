import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribersApi } from '../api/subscribers';

// ─── Footer link groups ────────────────────────────────────────────────────
// Organised into four columns for the desktop grid. Each link is either an
// internal route (handled via react-router) or a hash-anchor for placeholders
// you can wire up later (e.g. /privacy, /terms, /returns).
const FOOTER_LINKS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Menswear", to: "/men" },
      { label: "Womenswear", to: "/women" },
      { label: "Accessories", to: "/accessories" },
      { label: "Campaigns", to: "/campaigns" },
    ],
  },
  {
    title: "Store",
    links: [
      { label: "Client Services", to: "/services" },
      { label: "Size Guide", to: "/size-guide" },
      { label: "Shipping", to: "/services" },
      { label: "Returns & Refunds", to: "/services" },
      { label: "Track Order", to: "/orders" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Instagram", to: "https://instagram.com", external: true },
      { label: "Pinterest", to: "https://pinterest.com", external: true },
      { label: "support@dvsk.shop", to: "mailto:support@dvsk.shop", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", to: "#terms" },
      { label: "Privacy Policy", to: "#privacy" },
      { label: "Cookie Policy", to: "#cookies" },
      { label: "Refund Policy", to: "#refunds" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Newsletter subscribe form state
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [subMessage, setSubMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubStatus('loading');
    setSubMessage('');
    try {
      const result = await subscribersApi.subscribe(subEmail.trim(), 'footer');
      setSubStatus(result.alreadySubscribed ? 'already' : 'success');
      setSubMessage(result.alreadySubscribed
        ? "You're already on the list — see you on the next drop."
        : "Welcome to the Syndicate. Watch your inbox.");
      if (!result.alreadySubscribed) setSubEmail('');
      // Auto-clear status after a few seconds
      setTimeout(() => { setSubStatus('idle'); setSubMessage(''); }, 6000);
    } catch (err: any) {
      setSubStatus('error');
      setSubMessage(err?.message || "Couldn't subscribe — try again.");
      setTimeout(() => { setSubStatus('idle'); setSubMessage(''); }, 6000);
    }
  };

  return (
    <footer
      className="dvsk-footer"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "70px clamp(20px, 4vw, 56px) 0",
        backgroundColor: "transparent",
        position: "relative",
        zIndex: 10,
        marginTop: "100px",
        overflow: "hidden",
      }}
    >
      {/* ─── REQUEST ACCESS CARD (newsletter) ───
           Fades up + slightly enlarges as it scrolls into view. */}
      <motion.div
        className="dvsk-footer-card"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: "600px",
          margin: "0 auto 90px",
          padding: "40px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          textAlign: "center",
        }}
      >
        <h4
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "26px",
            fontWeight: 300,
            marginBottom: "12px",
            color: "#fff",
          }}
        >
          Request Access
        </h4>
        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "26px",
            textTransform: "uppercase",
            lineHeight: 1.7,
          }}
        >
          Join the Syndicate. Early access to archives, core drops, and private installations.
        </p>
        {/* When subscribed, the whole form area transforms into a
            celebratory welcome panel. Otherwise, normal subscribe form. */}
        {subStatus === 'success' || subStatus === 'already' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", padding: "20px 0", overflow: "hidden" }}
          >
            {/* Animated cream checkmark seal */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                margin: "0 auto 18px",
                background:
                  "linear-gradient(135deg, rgba(255,235,171,0.18) 0%, rgba(255,235,171,0.04) 100%)",
                border: "1.5px solid rgba(255,235,171,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 32px rgba(255,235,171,0.18)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <motion.path
                  d="M5 11.5 L9.5 16 L17 7"
                  stroke="#ffebab"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </svg>
            </motion.div>

            {/* Cream sparkle particles */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: -20, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * 60,
                    y: -20 + Math.sin(angle) * 60,
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.4],
                  }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    top: 38,
                    left: "50%",
                    width: 3,
                    height: 3,
                    marginLeft: -1.5,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? "#ffebab" : "#c084fc",
                    boxShadow: i % 2 === 0
                      ? "0 0 8px rgba(255,235,171,0.7)"
                      : "0 0 8px rgba(192,132,252,0.7)",
                    pointerEvents: "none",
                  }}
                />
              );
            })}

            {/* Main message */}
            <motion.h5
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "26px",
                fontWeight: 300,
                color: "#fff",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {subStatus === 'success' ? "Welcome to the family." : "You're already in."}
            </motion.h5>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,235,171,0.7)",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              {subStatus === 'success'
                ? "Drops · Archives · Private Releases — straight to your inbox"
                : "We've got you on the list — see you on the next drop."}
            </motion.p>
          </motion.div>
        ) : (
          <>
            <form
              className="dvsk-footer-form"
              style={{ display: "flex", gap: "10px" }}
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                required
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                disabled={subStatus === 'loading'}
                className="dvsk-footer-input"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: `1px solid ${subStatus === 'error' ? 'rgba(252,165,165,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  padding: "15px 20px",
                  color: "#fff",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  outline: "none",
                  fontFamily: "'Jost', sans-serif",
                  opacity: subStatus === 'loading' ? 0.6 : 1,
                  transition: "border-color 0.3s",
                }}
              />
              <button
                type="submit"
                disabled={subStatus === 'loading' || !subEmail.trim()}
                className="dvsk-footer-btn"
                style={{
                  background: subStatus === 'loading' ? "rgba(255,235,171,0.5)" : "#ffebab",
                  color: "#000",
                  border: "none",
                  padding: "0 30px",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                  cursor: subStatus === 'loading' ? "not-allowed" : "pointer",
                  textTransform: "uppercase",
                  transition: "background 0.3s",
                  minWidth: 100,
                }}
                onMouseEnter={(e) => { if (subStatus !== 'loading') e.currentTarget.style.background = "#ffe199"; }}
                onMouseLeave={(e) => { if (subStatus !== 'loading') e.currentTarget.style.background = "#ffebab"; }}
              >
                {subStatus === 'loading' ? "..." : "Join"}
              </button>
            </form>

            {/* Error feedback line */}
            {subStatus === 'error' && subMessage && (
              <p
                style={{
                  fontSize: 11,
                  marginTop: 14,
                  marginBottom: 0,
                  letterSpacing: "0.05em",
                  color: "#fca5a5",
                }}
              >
                {subMessage}
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* ─── LINK GRID (4 columns on desktop, stacks on mobile) ───
           Each column staggers in with its own delay for a wave reveal. */}
      <div
        className="dvsk-footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "60px",
          maxWidth: "1200px",
          margin: "0 auto 70px",
          paddingBottom: "50px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {FOOTER_LINKS.map((group, gi) => (
          <motion.div
            key={group.title}
            // Animate on mount with stagger — `whileInView` was getting
            // missed during page transitions, leaving columns invisible.
            // `animate` always fires, ensuring the links are visible.
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 + 0.08 * gi, ease: [0.22, 1, 0.36, 1] }}
          >
            <h5
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,235,171,0.7)",
                fontWeight: 700,
                marginBottom: "20px",
                marginTop: 0,
              }}
            >
              {group.title}
            </h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "11px" }}>
              {group.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.to}
                      target={link.to.startsWith("http") ? "_blank" : undefined}
                      rel={link.to.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="dvsk-footer-link"
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.6)",
                        textDecoration: "none",
                        letterSpacing: "0.04em",
                        transition: "color 0.3s",
                      }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      onClick={() => link.to.startsWith("#") ? null : navigate(link.to)}
                      className="dvsk-footer-link"
                      style={{
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "12px",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        fontFamily: "'Jost', sans-serif",
                        textAlign: "left",
                        transition: "color 0.3s",
                      }}
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* ─── BRAND + LEGAL STRIP ─── */}
      <motion.div
        className="dvsk-footer-legal"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: "1200px",
          margin: "0 auto 60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#fff",
              margin: 0,
              lineHeight: 1,
            }}
          >
            DVSK
          </h3>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              fontWeight: 600,
              margin: "6px 0 0",
              fontFamily: "'Jost', sans-serif",
            }}
          >
            Syndicate · Made in India
          </p>
        </div>
        <p
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.18em",
            fontFamily: "'Jost', sans-serif",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          © {currentYear} DVSK CLO · ALL RIGHTS RESERVED
        </p>
      </motion.div>

      {/* ─── GIANT TYPOGRAPHIC SIGN-OFF ───────────────────────────────────
          Bleed-to-edge massive ©YEAR. Sits in dark charcoal on black so
          it reads as decorative typography rather than informational text —
          common pattern at Balenciaga, Off-White, etc.

          Uses a longer 1.4s ease so the giant text feels weighty, not
          snappy. Cream cross-stroke fades in at the same time. */}
      <motion.div
        className="dvsk-footer-massive"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          padding: "30px clamp(20px, 4vw, 56px) 20px",
          margin: "0 calc(-1 * clamp(20px, 4vw, 56px))",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Tiny bullet accent (top-left) */}
        <span
          style={{
            position: "absolute",
            top: 22,
            left: "clamp(20px, 4vw, 56px)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            display: "block",
          }}
        />

        <div
          className="dvsk-footer-massive-text"
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(5rem, 22vw, 18rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.06)",
            userSelect: "none",
            display: "block",
            paddingTop: 12,
            // Subtle inner stroke effect — looks better than flat dark grey
            WebkitTextStroke: "1px rgba(255,235,171,0.04)",
          }}
        >
          ©{currentYear}
        </div>
      </motion.div>

      <style>{`
        .dvsk-footer-link {
          position: relative;
          transition: color 0.3s ease;
        }
        .dvsk-footer-link:hover {
          color: #c084fc !important;
          text-shadow: 0 0 12px rgba(192,132,252,0.4);
        }
        @media (max-width: 900px) {
          .dvsk-footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 40px !important;
          }
        }
        @media (max-width: 768px) {
          .dvsk-footer { padding: 50px 20px 0 !important; margin-top: 60px !important; }
          .dvsk-footer-card { padding: 28px 22px !important; margin-bottom: 60px !important; }
          .dvsk-footer-form { flex-direction: column !important; gap: 12px !important; }
          .dvsk-footer-input { padding: 14px 16px !important; }
          .dvsk-footer-btn { padding: 14px 24px !important; }
          .dvsk-footer-grid { gap: 32px !important; margin-bottom: 50px !important; padding-bottom: 36px !important; }
          .dvsk-footer-legal { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; margin-bottom: 40px !important; }
        }
        @media (max-width: 480px) {
          .dvsk-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </footer>
  );
}
