import React, { useEffect, useRef, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { PropsWithChildren } from "react";
import * as math from "mathjs";
import 'lenis/dist/lenis.css'
import { ReactLenis, useLenis } from 'lenis/react'
import Lenis from 'lenis'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ──── Components ──────────────────────────────────────────────────────────────

import ScrollFloat from "../components/ScrollFloat";

// ──── Navbar ──────────────────────────────────────────────────────────────
import Navbar from "../components/Navbar";

// ──── Images ──────────────────────────────────────────────────────────────
import productImage from '../assets/image6.png';
import Image2 from '../assets/image7.avif'
import Image3 from '../assets/Gemini_Generated_Image_a8lix1a8lix1a8li.png';
import Image4 from '../assets/image3.png';
import Image5 from '../assets/Gemini_Generated_Image_gczwalgczwalgczw.png';

// ──── Curved Loop ──────────────────────────────────────────────────────────────
import CurvedLoop from '../components/CurvedLoop';

type GradualBlurProps = PropsWithChildren<{
  position?: "top" | "bottom" | "left" | "right";
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  preset?:
  | "top" | "bottom" | "left" | "right"
  | "subtle" | "intense" | "smooth" | "sharp"
  | "header" | "footer" | "sidebar"
  | "page-header" | "page-footer";
  gpuOptimized?: boolean;
  hoverIntensity?: number;
  target?: "parent" | "page";
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}>;

const DEFAULT_CONFIG: Partial<GradualBlurProps> = {
  position: "bottom", strength: 2, height: "6rem", divCount: 5,
  exponential: false, zIndex: 1000, animated: false, duration: "0.3s",
  easing: "ease-out", opacity: 1, curve: "linear", responsive: false,
  target: "parent", className: "", style: {},
};

const PRESETS: Record<string, Partial<GradualBlurProps>> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
};

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const mergeConfigs = (...configs: Partial<GradualBlurProps>[]): Partial<GradualBlurProps> =>
  configs.reduce((acc, config) => ({ ...acc, ...config }), {});

const getGradientDirection = (position: string): string =>
  ({ top: "to top", bottom: "to bottom", left: "to left", right: "to right" }[position] || "to bottom");

const debounce = <T extends (...a: any[]) => void>(fn: T, wait: number) => {
  let t: ReturnType<typeof setTimeout>;
  return (...a: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
};

const useResponsiveDimension = (
  responsive: boolean | undefined,
  config: Partial<GradualBlurProps>,
  key: keyof GradualBlurProps
) => {
  const [val, setVal] = useState<any>(config[key]);
  useEffect(() => {
    if (!responsive) return;
    const calc = () => {
      const w = window.innerWidth;
      let v: any = config[key];
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      const k = cap(key as string);
      if (w <= 480 && (config as any)["mobile" + k]) v = (config as any)["mobile" + k];
      else if (w <= 768 && (config as any)["tablet" + k]) v = (config as any)["tablet" + k];
      else if (w <= 1024 && (config as any)["desktop" + k]) v = (config as any)["desktop" + k];
      setVal(v);
    };
    const deb = debounce(calc, 100);
    calc();
    window.addEventListener("resize", deb);
    return () => window.removeEventListener("resize", deb);
  }, [responsive, config, key]);
  return responsive ? val : (config as any)[key];
};

const useIntersectionObserver = (ref: React.RefObject<HTMLDivElement>, shouldObserve = false) => {
  const [isVisible, setIsVisible] = useState(!shouldObserve);
  useEffect(() => {
    if (!shouldObserve || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);
  return isVisible;
};

const GradualBlur: React.FC<GradualBlurProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props) as Required<GradualBlurProps>;
  }, [props]);

  const responsiveHeight = useResponsiveDimension(config.responsive, config, "height");
  const responsiveWidth = useResponsiveDimension(config.responsive, config, "width");
  const isVisible = useIntersectionObserver(containerRef, config.animated === "scroll");

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / config.divCount;
    const currentStrength = isHovered && config.hoverIntensity
      ? config.strength * config.hoverIntensity : config.strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
    for (let i = 1; i <= config.divCount; i++) {
      let progress = i / config.divCount;
      progress = curveFunc(progress);
      let blurValue: number;
      if (config.exponential) {
        blurValue = Number(math.pow(2, progress * 4)) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * config.divCount + 1) * currentStrength;
      }
      const p1 = math.round((increment * i - increment) * 10) / 10;
      const p2 = math.round(increment * i * 10) / 10;
      const p3 = math.round((increment * i + increment) * 10) / 10;
      const p4 = math.round((increment * i + increment * 2) * 10) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;
      const divStyle: CSSProperties = {
        maskImage: `linear-gradient(${getGradientDirection(config.position)}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${getGradientDirection(config.position)}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        transition: config.animated && config.animated !== "scroll"
          ? `backdrop-filter ${config.duration} ${config.easing}` : undefined,
      };
      divs.push(<div key={i} style={{ position: "absolute", inset: 0, ...divStyle }} />);
    }
    return divs;
  }, [config, isHovered]);

  const containerStyle: CSSProperties = useMemo(() => {
    const isVertical = ["top", "bottom"].includes(config.position);
    const isHorizontal = ["left", "right"].includes(config.position);
    const isPageTarget = config.target === "page";
    const baseStyle: CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    };
    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || "100%";
      baseStyle[config.position] = 0;
      baseStyle.left = 0; baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = "100%";
      baseStyle[config.position] = 0;
      baseStyle.top = 0; baseStyle.bottom = 0;
    }
    return baseStyle;
  }, [config, responsiveHeight, responsiveWidth, isVisible]);

  const { hoverIntensity, animated, onAnimationComplete, duration } = config as any;
  useEffect(() => {
    if (isVisible && animated === "scroll" && onAnimationComplete) {
      const t = setTimeout(() => onAnimationComplete(), parseFloat(duration) * 1000);
      return () => clearTimeout(t);
    }
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.target === "page" ? "gradual-blur-page" : "gradual-blur-parent"} ${config.className}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>{blurDivs}</div>
      {props.children && <div style={{ position: "relative" }}>{props.children}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Home Component
// ─────────────────────────────────────────────

const COLLECTION_DATA = [
  { text: "Tailored with absolute precision. Our garments redefine modern luxury.", image: Image2 },
  { text: "Draped in elegance. Every silhouette is meticulously crafted for a flawless fit.", image: Image3 },
  { text: "Tactile fabrics and fluid movement bring each collection to life.", image: Image4 },
  { text: "Experience the perfect harmony of comfort, structure, and uncompromising quality.", image: Image2 }
];

const ScrollTextItem: React.FC<{ text: string; index: number; onEnter: (i: number) => void }> = ({ text, index, onEnter }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "start 35%"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const filter = useTransform(scrollYProgress, [0, 1], ["blur(12px)", "blur(0px)"]);

  return (
    <motion.div
      ref={ref}
      style={{ ...styles.scrollText, opacity, y, filter, position: "relative", zIndex: 2 } as Record<string, any>}
      onViewportEnter={() => onEnter(index)}
      viewport={{ amount: 0.5, once: false }}
    >
      {text}
    </motion.div>
  );
};

const MagneticButton: React.FC<{ children: React.ReactNode, onClick?: () => void }> = ({ children, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.5, y: middleY * 0.5 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 64px",
        borderRadius: "100px",
        backgroundColor: "#ffffff",
        color: "#080808",
        fontFamily: "'Jost', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.2em",
        cursor: "pointer",
        textTransform: "uppercase",
        border: "none",
        boxShadow: "0 0 60px rgba(255,255,255,0.2)",
        marginTop: "10vh",
        position: "relative",
        zIndex: 5
      }}
    >
      <motion.span
        animate={{ x: position.x * 0.3, y: position.y * 0.3 }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        style={{ pointerEvents: "none" }}
      >
        {children}
      </motion.span>
    </motion.div>
  )
};

const Home: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const section2Ref = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [zoomedCategory, setZoomedCategory] = useState<string | null>(null);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  const handleCategoryClick = (id: string) => {
    if (zoomedCategory) return;
    setZoomedCategory(id);
    setTimeout(() => {
      navigate(`/${id}`);
    }, 800);
  };

  const { scrollYProgress: sectionY } = useScroll({
    target: section2Ref,
    offset: ["start end", "end start"]
  });

  const imageScale = useTransform(sectionY, [0, 1], [1, 1.2]);
  const indicatorHeight = useTransform(sectionY, [0, 1], ["0%", "100%"]);


  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div style={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <main style={styles.main}>
        <div style={styles.blobLeft} />
        <div style={styles.blobRight} />
        <div style={styles.blobCenter} />

        {/* Full screen background image */}
        <img
          src={productImage}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            zIndex: 0,
            opacity: 0.92,
          }}
        />

        {/* UI Elements Overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", overflow: "hidden" }}>

          {/* Bottom Left Glass Info Card */}
          <div style={{ position: "absolute", bottom: "15%", left: "clamp(20px, 4vw, 56px)", width: "100%" }}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                padding: "32px",
                borderLeft: "2px solid #ffebab",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                maxWidth: "380px",
                pointerEvents: "auto",
                willChange: "transform, opacity"
              }}
            >
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: "#ffebab", textTransform: "uppercase", marginBottom: "12px", margin: 0 }}>Collection FW/26</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", color: "white", margin: "12px 0", lineHeight: 1.1 }}>Elegance<br />Redefined</p>
              <div style={{ width: "40px", height: "1px", background: "rgba(255,255,255,0.3)", marginBottom: "16px" }} />
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6, fontWeight: 300 }}>Experience the perfect harmony of comfort, structure, and uncompromising quality draped in darkness.</p>
            </motion.div>
          </div>
        </div>

        {/* GradualBlur top — sits above image, below text */}
        <GradualBlur
          position="top"
          height="140px"
          strength={3}
          divCount={7}
          curve="ease-out"
          zIndex={3}
        />

        {/*
          ── KEY FIX ──
          This bottom overlay is a pure CSS gradient from transparent → #080808.
          It covers the bottom ~40% of the hero, completely dissolving it into
          the background color so there is zero visible edge/seam.
          GradualBlur alone only blurs, it doesn't cover — you need this solid fade.
        */}
        <div style={styles.heroBottomFade} />
      </main>

      {/* ── Branding — flush against hero, no gap ── */}

      <div style={styles.curvedLoopWrapper}>
        <CurvedLoop marqueeText="DVSK ✦" />
      </div>

      {/* ── Section 2 ── */}
      <section style={{ ...styles.section2, position: "relative" }} ref={section2Ref}>

        {/* LEFT IMAGE & INDICATOR */}
        <div style={styles.leftWrapperOuter}>

          {/* Ambient Glow Matching Hero Theme */}
          <div style={{ ...styles.blobLeft, top: "40%", left: "-5%", zIndex: 0, opacity: 0.8 }} />

          {/* SCROLL INDICATOR */}
          <div style={styles.scrollIndicatorWrapper}>
            <div style={styles.scrollIndicatorLine}>
              <motion.div style={{ ...styles.scrollIndicatorFill, height: indicatorHeight } as Record<string, any>} />
            </div>
            <div style={styles.indicatorText}>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>DVSK CLO. ✦ SCROLL</span>
            </div>
          </div>

          <div style={styles.leftImageWrapper}>
            <motion.div style={{ width: "100%", height: "100%", scale: imageScale } as Record<string, any>}>
              <AnimatePresence>
                <motion.div
                  key={activeScrollIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${COLLECTION_DATA[activeScrollIndex].image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div style={styles.rightContent}>
          {/* 
            ── RIGHT SIDE BACKGROUND ELEMENTS ──
            Positioned absolutely within rightContent to act as a background.
            Parallax effects bound to sectionY.
          */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>

            {/* Ambient Glow */}
            <div style={{ ...styles.blobRight, position: "absolute", top: "50%", right: "-10%", width: "500px", height: "500px", opacity: 0.4 }} />

            {/* Huge background text watermark - Parallax */}
            <motion.div style={{
              position: "absolute",
              top: "20%",
              right: "-20%",
              fontSize: "25vw",
              fontFamily: "'Cormorant Garamond', serif",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.03)",
              lineHeight: 0.8,
              whiteSpace: "nowrap",
              originX: 0.5, originY: 0.5,
              rotate: 90,
              y: useTransform(sectionY, [0, 1], [600, -800])
            } as Record<string, any>}>
              DVSK
            </motion.div>

            {/* Spinning star - Scroll tied */}
            <motion.div style={{
              position: "absolute",
              bottom: "30%",
              left: "10%",
              fontSize: "180px",
              color: "rgba(255,255,255,0.04)",
              rotate: useTransform(sectionY, [0, 1], [0, 180]),
              y: useTransform(sectionY, [0, 1], [300, -400])
            } as Record<string, any>}>
              ✦
            </motion.div>

            {/* Second Spinning star higher up */}
            <motion.div style={{
              position: "absolute",
              top: "15%",
              right: "15%",
              fontSize: "240px",
              color: "rgba(255,255,255,0.02)",
              rotate: useTransform(sectionY, [0, 1], [180, 0]),
              y: useTransform(sectionY, [0, 1], [100, -500])
            } as Record<string, any>}>
              ✦
            </motion.div>

            {/* Infinite Falling Star ✦ 1 - Inclined, Slow with Dust Trail */}
            <div style={{
              position: "absolute",
              top: "0%",
              left: "10%",
              transform: "rotate(55deg)", // Inclined downwards to the right
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <motion.div
                animate={{
                  x: ["-10vw", "80vw"],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 12, // Much slower
                  repeat: Infinity,
                  ease: "linear", // Smooth, constant slow speed
                  repeatDelay: 2
                }}
                style={{
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {/* Dust Trail */}
                <div style={{
                  width: "200px", // Length of the dust trail
                  height: "1px",
                  background: "linear-gradient(to right, transparent 0%, rgba(255, 200, 100, 0.2) 40%, rgba(255, 220, 150, 0.8) 100%)",
                  boxShadow: "0 0 15px rgba(255, 140, 0, 0.6)",
                  marginRight: "-8px" // Connects with the star seamlessly
                }} />
                {/* The Star */}
                <div style={{
                  fontSize: "14px", // Made it small
                  color: "#FFF",
                  textShadow: "0 0 15px #FFD700, 0 0 25px #FF8C00",
                  transform: "rotate(-55deg)" // Keep the ✦ visually upright
                }}>✦</div>
              </motion.div>
            </div>

            {/* Infinite Falling Star ✦ 2 - Delayed & Slow */}
            <div style={{
              position: "absolute",
              top: "-5%",
              left: "40%",
              transform: "rotate(40deg)", // Slightly different inclination
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <motion.div
                animate={{
                  x: ["-10vw", "80vw"],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 15, // Very slow
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 4
                }}
                style={{
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {/* Dust Trail */}
                <div style={{
                  width: "150px",
                  height: "1px",
                  background: "linear-gradient(to right, transparent 0%, rgba(255, 180, 80, 0.6) 100%)",
                  boxShadow: "0 0 10px rgba(255, 120, 0, 0.4)",
                  marginRight: "-6px"
                }} />
                {/* The Star */}
                <div style={{
                  fontSize: "12px", // Extremely small
                  color: "#FFF",
                  textShadow: "0 0 10px #FFD700, 0 0 20px #FF8C00"
                }}>✦</div>
              </motion.div>
            </div>
          </div>

          {COLLECTION_DATA.map((item, index) => (
            <ScrollTextItem
              key={index}
              text={item.text}
              index={index}
              onEnter={setActiveScrollIndex}
            />
          ))}

          {/* Eye-catching interactive Magnetic element at the end */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "-30vh" }}>
            <MagneticButton>
              EXPLORE COLLECTION
            </MagneticButton>
          </div>
        </div>

      </section>

      {/* ── Section 3: Options / Collections ── */}
      <section style={styles.section3}>
        <div style={styles.section3Header}>
          <h2 style={styles.sectionHeading}>EXPLORE CURATIONS</h2>
          <div style={styles.divider} />
        </div>

        <div style={styles.categoriesContainer} className="categories-container">
          {[
            { id: "men", title: "MENSWEAR", image: Image3 },
            { id: "women", title: "WOMENSWEAR", image: Image2 },
            { id: "accessories", title: "ACCESSORIES", image: productImage }
          ].map((cat) => {
            const isZoomed = zoomedCategory === cat.id;
            const isOtherZoomed = zoomedCategory && zoomedCategory !== cat.id;

            return (
              <motion.div
                key={cat.id}
                style={styles.categoryBox}
                className="category-box"
                whileHover={zoomedCategory ? {} : { scale: 0.98 }}
                animate={
                  isZoomed
                    ? { scale: 0.85, opacity: 0, filter: "blur(12px)" }
                    : isOtherZoomed
                      ? { scale: 0.95, opacity: 0, filter: "blur(4px)" }
                      : { scale: 1, opacity: 1, filter: "blur(0px)" }
                }
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  opacity: 0.25, transition: "opacity 0.6s ease"
                }} className="cat-bg" />

                <div style={styles.categoryBoxTitle}>{cat.title}</div>
                <div style={styles.categoryBoxSub}>DISCOVER ↗</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #080808; overflow-x: hidden; }
        .gradual-blur { pointer-events: none; transition: opacity .3s ease-out; }
        
        .category-box:hover .cat-bg { opacity: 0.6 !important; }
        
        @media (max-width: 1024px) {
          .categories-container {
            flex-direction: column !important;
          }
          .category-box {
            height: 40vh !important;
            min-height: 250px !important;
          }
        }

        @media (max-width: 768px) {
          .hero-heading { font-size: clamp(4rem, 20vw, 8rem) !important; }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#080808",
    color: "#ffffff",
    margin: 0,
  },
  main: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    paddingTop: "72px",
    textAlign: "center",
    gap: 0,
    // No margin-bottom — the heroBottomFade handles the dissolve
  },

  // ── THE KEY ELEMENT ──
  // A tall gradient that sits over the bottom of the hero image,
  // fading from fully transparent at the top to solid #080808 at the bottom.
  // This ensures the hero bleeds into the page color with zero hard edge.
  heroBottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "43%",           // covers the lower half of the hero
    background: "linear-gradient(to bottom, transparent 0%, rgba(8,8,8,0.6) 40%, rgba(8,8,8,0.92) 70%, #080808 100%)",
    zIndex: 2,               // above image (z0), below text (z4) and GradualBlur (z3) — but we want it above blurs too
    pointerEvents: "none",
  },

  blobLeft: {
    position: "absolute",
    top: "30%", left: "-10%",
    width: "clamp(260px, 45vw, 700px)",
    height: "clamp(260px, 45vw, 700px)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(80,0,160,0.18) 0%, transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none", zIndex: 0,
  },
  blobRight: {
    position: "absolute",
    top: "15%", right: "-12%",
    width: "clamp(220px, 40vw, 650px)",
    height: "clamp(220px, 40vw, 650px)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,43,226,0.12) 0%, transparent 70%)",
    filter: "blur(50px)",
    pointerEvents: "none", zIndex: 0,
  },
  blobCenter: {
    position: "absolute",
    bottom: "-5%", left: "50%",
    transform: "translateX(-50%)",
    width: "clamp(180px, 35vw, 500px)",
    height: "clamp(180px, 35vw, 500px)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(60,0,120,0.10) 0%, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none", zIndex: 0,
  },
  eyebrow: {
    position: "relative", zIndex: 4,
    fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: "10px", letterSpacing: "0.45em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
    margin: "0 0 28px",
  } as React.CSSProperties,
  divider: {
    position: "relative", zIndex: 4,
    width: "32px", height: "0.5px",
    background: "rgba(255,255,255,0.18)",
    margin: "32px auto 28px",
  },
  sub: {
    position: "relative", zIndex: 4,
    fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: "11px", letterSpacing: "0.38em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
    margin: "0 0 40px",
  } as React.CSSProperties,

  // Flush wrapper — no spacing, pure #080808 background
  curvedLoopWrapper: {
    backgroundColor: "#080808",
    fontFamily: "'Jost', sans-serif",
    color: "#8C8B82",
    marginTop: "-290px",       // collapse any subpixel gap from the hero
    padding: 0,
    overflow: "hidden",
    marginBottom: "-400px"
  },

  section2: {
    minHeight: "100vh",
    backgroundColor: "#080808",
    display: "flex",
    alignItems: "stretch", // Allows columns to be full height so sticky works
    justifyContent: "space-between",
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    paddingTop: "10vh", // Padding for smooth scroll entry
    paddingBottom: "20vh",
  },
  sectionInner: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  sectionEyebrow: {
    fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: "10px", letterSpacing: "0.45em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
    margin: "0 0 24px",
  } as React.CSSProperties,
  sectionHeading: {
    fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
    fontSize: "clamp(3rem, 8vw, 7rem)", letterSpacing: "0.28em",
    margin: 0, lineHeight: 1,
    background: "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.65) 50%, rgba(200,160,255,0.8) 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  } as React.CSSProperties,
  sectionBody: {
    fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: "12px", letterSpacing: "0.25em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
    marginTop: "16px",
  } as React.CSSProperties,
  bottomNav: {
    position: "absolute",
    bottom: "clamp(24px, 4vh, 40px)", left: "50%",
    transform: "translateX(-50%)",
    display: "flex", alignItems: "center",
    gap: "clamp(18px, 3vw, 36px)",
    zIndex: 4, whiteSpace: "nowrap",
  },


  leftWrapperOuter: {
    width: "50%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingLeft: "clamp(20px, 4vw, 60px)",
  },

  scrollIndicatorWrapper: {
    position: "sticky" as const,
    top: "10vh",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: "clamp(20px, 4vw, 60px)",
    paddingTop: "20px",
    paddingBottom: "20px",
  },

  scrollIndicatorLine: {
    width: "1px",
    height: "60vh",
    backgroundColor: "rgba(255,255,255,0.1)",
    position: "relative",
    borderRadius: "2px",
    overflow: "hidden",
  },

  scrollIndicatorFill: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    background: "linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(200,160,255,0.9) 100%)",
  },

  indicatorText: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    fontSize: "10px",
    letterSpacing: "0.45em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    marginTop: "20px",
  },

  leftImageWrapper: {
    width: "65%",
    height: "90vh",
    position: "sticky" as const,
    top: "5vh",
    borderRadius: "24px",
    overflow: "hidden", // bounds the scaling inner image
  },

  leftImageInner: {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${Image2})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transformOrigin: "center center",
  },

  rightContent: {
    width: "50%",
    padding: "30vh 80px",
    display: "flex",
    flexDirection: "column",
    gap: "60vh",
    position: "relative" as const,
  },

  scrollText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 300,
    fontSize: "clamp(2rem, 4vw, 3.2rem)",
    background: "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.65) 50%, rgba(200,160,255,0.8) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1.2,
  },

  section3: {
    minHeight: "100vh",
    backgroundColor: "#080808",
    padding: "12vh 4vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "80px",
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
  },
  section3Header: {
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  categoriesContainer: {
    display: "flex",
    flexDirection: "row" as const,
    gap: "clamp(20px, 3vw, 40px)",
    width: "100%",
    maxWidth: "1600px",
    justifyContent: "space-between",
  },
  categoryBox: {
    flex: 1,
    height: "70vh",
    minHeight: "450px",
    backgroundColor: "#0d0d0d",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px",
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden",
    border: "0.5px solid rgba(255,255,255,0.08)",
  },
  categoryBoxTitle: {
    position: "relative",
    zIndex: 2,
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 400,
    fontSize: "clamp(2rem, 3vw, 3.5rem)",
    color: "#ffffff",
    letterSpacing: "0.05em",
  },
  categoryBoxSub: {
    position: "relative",
    zIndex: 2,
    alignSelf: "flex-end",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 300,
    fontSize: "12px",
    letterSpacing: "0.2em",
    color: "#ffffff",
    padding: "12px 24px",
    border: "0.5px solid rgba(255,255,255,0.2)",
    borderRadius: "100px",
  },
};

export default Home;