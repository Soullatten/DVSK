import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string;
  salePrice?: number | string | null;
  tag: string;
  category: { name: string };
  images?: Array<{ url: string }>;
}

interface Props {
  product: Product;
  /** Optional: when true, the entry animation is delayed (used in grid stagger). */
  index?: number;
}

/**
 * Cinematic product card with five layered effects, all driven by cursor:
 *
 *   1. 3D tilt — card rotates ±5° on X/Y axes following the cursor
 *   2. Spotlight — cream radial glow that tracks the cursor across the image
 *   3. Ken Burns — slow scale 1.0 → 1.05 over 4s on hover
 *   4. Cream sheen — diagonal gradient sweep that crosses the image on hover
 *   5. Film grain — animated noise overlay for that 35mm photochemical feel
 *
 * The tilt + spotlight use framer-motion's useMotionValue + useSpring so the
 * motion is buttery and stays GPU-accelerated. Spring stiffness tuned so it
 * feels weighted (a cheap card snaps; a luxe one settles).
 */
export default function ProductCardCinematic({ product, index = 0 }: Props) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Cursor position relative to card (-0.5 to +0.5 on each axis)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Spring-smoothed for buttery motion. Stiffer = snappier, lower = floatier.
  const sx = useSpring(mx, { stiffness: 220, damping: 28, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 220, damping: 28, mass: 0.6 });

  // 3D tilt — limited to ±5° so it feels luxe, not gimmicky
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [5, -5]);

  // Spotlight position in CSS percent
  const spotlightX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const spotlightY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const formattedPrice = (n: number | string) =>
    `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <motion.div
      layout
      key={product.id}
      onClick={() => navigate(`/product/${product.slug}`)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      style={{ cursor: "pointer", textAlign: "left", perspective: 1200 }}
      className="dvsk-pcard"
    >
      {/* IMAGE FRAME — the 3D-tilted shell */}
      <motion.div
        ref={cardRef}
        style={{
          width: "100%",
          aspectRatio: "3/4",
          position: "relative",
          marginBottom: "16px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #161616 50%, #0a0a0a 100%)",
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 1200,
          willChange: "transform",
        }}
      >
        {/* Inner image container — clipped, separate layer so the image can
            Ken-Burns zoom independently of the tilt */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {/* No-image fallback */}
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center", flexDirection: "column",
            gap: "8px", pointerEvents: "none",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>No Image</div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)" }}>DVSK</div>
          </div>

          {/* The image itself — Ken Burns slow zoom */}
          {product.images?.[0]?.url && (
            <img
              src={product.images[0].url}
              alt={product.name}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                position: "relative", zIndex: 1,
                transition: "transform 4s cubic-bezier(0.22, 1, 0.36, 1), filter 0.6s ease",
                willChange: "transform",
              }}
              className="dvsk-pcard-img"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}

          {/* SHEEN — diagonal cream gradient sweeps across on hover */}
          <div
            className="dvsk-pcard-sheen"
            style={{
              position: "absolute", inset: 0, zIndex: 2,
              background: "linear-gradient(115deg, transparent 35%, rgba(255,235,171,0.22) 50%, transparent 65%)",
              transform: "translateX(-100%)",
              transition: "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />

          {/* SPOTLIGHT — cream radial halo that follows cursor */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              pointerEvents: "none",
              background: useTransform(
                [spotlightX, spotlightY] as any,
                ([x, y]: any) =>
                  `radial-gradient(circle 240px at ${x} ${y}, rgba(255,235,171,0.18), transparent 65%)`
              ),
              opacity: 0,
              transition: "opacity 0.4s ease",
              mixBlendMode: "screen",
            }}
            className="dvsk-pcard-spotlight"
          />

          {/* FILM GRAIN — subtle moving noise overlay (CSS-only) */}
          <div
            className="dvsk-pcard-grain"
            style={{
              position: "absolute", inset: 0, zIndex: 4,
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.92  0 0 0 0 0.67  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              backgroundSize: "120px 120px",
              opacity: 0.06,
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          />

          {/* QUICK VIEW pill — appears on hover */}
          <div
            className="dvsk-pcard-overlay"
            style={{
              position: "absolute", inset: 0, zIndex: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                padding: "12px 28px",
                background: "rgba(255,235,171,0.12)",
                border: "1px solid rgba(255,235,171,0.5)",
                borderRadius: "100px",
                fontSize: "10px",
                letterSpacing: "0.25em",
                backdropFilter: "blur(8px)",
                color: "#ffebab",
                fontWeight: 600,
                boxShadow: "0 4px 24px rgba(255,235,171,0.18)",
                transform: "translateY(8px)",
                transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="dvsk-pcard-quickview"
            >
              QUICK VIEW
            </span>
          </div>

          {/* Tag pill (top-left) — sits above all effects */}
          <div
            style={{
              position: "absolute", top: "15px", left: "15px", zIndex: 6,
              background: "rgba(0,0,0,0.55)",
              border: "0.5px solid rgba(255,235,171,0.18)",
              backdropFilter: "blur(8px)",
              padding: "4px 8px",
              fontSize: "9px", letterSpacing: "0.18em",
              color: "rgba(255,235,171,0.9)",
              fontWeight: 600,
            }}
          >
            {product.tag.replace("_", " ")}
          </div>
        </div>
      </motion.div>

      {/* TEXT BLOCK — outside the 3D tilt, stays flat for readability */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 400, letterSpacing: "0.1em", margin: 0, textTransform: "uppercase", color: "#fff" }}>
          {product.name}
        </h3>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 300, letterSpacing: "0.05em" }}>
          {product.salePrice ? (
            <>
              <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.3)", marginRight: "8px" }}>
                {formattedPrice(product.basePrice)}
              </span>
              {formattedPrice(product.salePrice)}
            </>
          ) : (
            formattedPrice(product.basePrice)
          )}
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        {product.category.name}
      </div>

      <style>{`
        .dvsk-pcard:hover .dvsk-pcard-img {
          transform: scale(1.04);
          filter: brightness(0.92);
        }
        .dvsk-pcard:hover .dvsk-pcard-sheen {
          transform: translateX(100%);
        }
        .dvsk-pcard:hover .dvsk-pcard-spotlight {
          opacity: 1;
        }
        .dvsk-pcard:hover .dvsk-pcard-overlay {
          opacity: 1;
        }
        .dvsk-pcard:hover .dvsk-pcard-quickview {
          transform: translateY(0);
        }
      `}</style>
    </motion.div>
  );
}
