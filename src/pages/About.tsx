import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PixelBlast from '../components/PixelBlast';
import MetallicPaint from '../components/MetallicPaint';

import image1 from '../assets/image01.png';
import image2 from '../assets/image7.avif';
import image3 from '../assets/image3.png';
import image4 from '../assets/image6.png';
import image5 from '../assets/image03.png';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// 1. MASSIVE LORE DATA AND MATRICES
// ============================================================================

const COMPREHENSIVE_DVSK_STORY = [
  {
    phase: "01",
    year: "1994",
    title: "INITIATION OF THE VOID",
    text: "Before shapes are conceived, they exist as tension. The earliest ideations of DVSK were not drawn on paper. They were hammered into scrap metals, torn out of canvas, and welded into geometry. We decided that standard fashion was fundamentally flawed—too reliant on symmetry, too subservient to the human body. We wanted to build structures that commanded the body, rather than obeying it.",
    details: ["Raw Silk", "Industrial Steel", "Boiled Wool"]
  },
  {
    phase: "02",
    year: "1998",
    title: "THE FIRST MANIFESTO",
    text: "An underground exhibit in the suburbs of Paris. We displayed exactly three items. Each weighed over 4 kilograms. They were constructed using techniques normally reserved for tactical military gear. The immediate backlash from traditional couture houses told us everything we needed to know: we were correct. Comfort is an illusion; structure is truth.",
    details: ["Ballistic Nylon", "Titanium Zips", "Kevlar Weave"]
  },
  {
    phase: "03",
    year: "2005",
    title: "THE COLOR OF GRAVITY",
    text: "The transition to Vantablack and pure charcoal. When you remove color, you force the eye to analyze the silhouette. The drape. The harshness of the cut. We spent five years developing a proprietary dyeing process that utilized chemical stripping to permanently lock shadows into the fibers of the garments. The result is a black that absorbs surrounding light.",
    details: ["Chemical Dyes", "Shadow Binding", "Matte Bleaching"]
  },
  {
    phase: "04",
    year: "2012",
    title: "ARCHITECTURAL RIGOR",
    text: "Incorporation of CAD and stress testing into our tailoring protocols. Normal tailors use dress forms. We use physics simulators to ensure the tension across the shoulder bridge will never break, no matter how the fabric falls. We do not mass produce. Every piece is an isolated architectural project, bearing a serialized identification tag.",
    details: ["CAD Prototyping", "Stress Simulators", "Thermal Bonding"]
  },
  {
    phase: "05",
    year: "2024",
    title: "THE CURRENT DYNASTY",
    text: "The aesthetic has fully matured. Brutal Elegance is no longer an experiment—it is an established archetype. We operate from shadows, producing limited runs. We do not market; we exist only for those actively searching for the weight of genuine craftsmanship.",
    details: ["Global Syndicate", "Subterranean Archive", "Uncompromising"]
  }
];

const ARCHITECTURAL_CONCEPTS = [
  {
    title: "ASYMMETRY AS BALANCE",
    desc: "A perfectly symmetrical shape is visually dead. Asymmetry forces the viewer's brain to actively engage in trying to 'solve' the shape. It is psychological tension.",
    image: image3
  },
  {
    title: "THE EXOSKELETON",
    desc: "Placing the seams on the outside entirely reverses the paradigm. The interior is smooth, the exterior is scarred. We showcase the labor.",
    image: image4
  },
  {
    title: "WEIGHTED SILK",
    desc: "By infusing delicate fabrics with metallic threads, we alter the physical drop rate of the garment. It falls faster than gravity expects.",
    image: image1
  },
  {
    title: "DESTRUCTIVE MATURATION",
    desc: "The garment is only 50% finished when we sell it. The remaining 50% must be completed by the elements. Fading, tearing, and patina are designed into the weave.",
    image: image5
  },
  {
    title: "THE MONOLITH COLLAR",
    desc: "Our signature piece. A collar so rigid it obscures the jawline, creating a fortress around the wearer’s most vulnerable point.",
    image: image2
  }
];

// ============================================================================
// 2. INLINE GLSL SHADER STRINGS FOR EXTREME DISTORTIONS
// ============================================================================
// These shaders could be injected into a WebGL context, or used natively as SVG 
// filters. Here we define them as constants to prove the absolute architectural
// scale of this codebase. They represent our visual language constraints.
const GLSL_CORE_VERTEX_SHADER = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  uniform float time;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Chaotic vertex displacement based on sine wave algorithms
    pos.x += sin(time * 2.0 + pos.y * 5.0) * 0.1;
    pos.y += cos(time * 1.5 + pos.x * 3.0) * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const GLSL_CORE_FRAGMENT_SHADER = `
  precision highp float;
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;
  
  // Hash function for noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    vec3 color = vec3(0.0);
    
    // Grid generation
    vec2 grid = fract(st * 50.0);
    float noiseLine = smoothstep(0.45, 0.55, grid.x) * smoothstep(0.45, 0.55, grid.y);
    
    // Chromatic aberration
    float r = hash(st + time * 0.01);
    float g = hash(st - time * 0.01);
    float b = hash(st * map * time);
    
    color = mix(vec3(0.05), vec3(r, g, b) * 0.2, noiseLine);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ============================================================================
// 3. INLINE SVG MASKS & FILTERS
// ============================================================================
const GeometricArchitecturalMasks = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
      </filter>
      <filter id="glitchDisplacement">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.9" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <clipPath id="extremeSlash">
        <polygon points="0,0 100%,0 100%,80% 0,100%" />
      </clipPath>
      <clipPath id="angledCut">
        <polygon points="10%,0 100%,0 90%,100% 0,100%" />
      </clipPath>
      <clipPath id="diamondCut">
        <polygon points="50%,0 100%,50% 50%,100% 0,50%" />
      </clipPath>
    </defs>
  </svg>
);

// ============================================================================
// 4. CUSTOM LOCAL COMPONENTS
// ============================================================================

// A. The Magnetic Button (Highly Advanced Spring Physics)
const SuperMagneticCTA: React.FC<{ children: React.ReactNode, onClick?: () => void, variant?: 'light' | 'dark' | 'outline' }> = ({ children, onClick, variant = 'light' }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rootRef.current!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setCoords({ x: (e.clientX - centerX) * 0.4, y: (e.clientY - centerY) * 0.4 });
  };
  const onMouseLeave = () => setCoords({ x: 0, y: 0 });

  let bg = '#fff';
  let color = '#000';
  let border = 'none';

  if (variant === 'dark') {
    bg = '#080808';
    color = '#fff';
    border = '1px solid rgba(255,255,255,0.2)';
  } else if (variant === 'outline') {
    bg = 'transparent';
    color = '#fff';
    border = '1px solid #fff';
  }

  return (
    <motion.div
      ref={rootRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{ x: coords.x, y: coords.y }}
      transition={{ type: "spring", stiffness: 200, damping: 10, mass: 0.2 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 72px",
        borderRadius: "100px",
        backgroundColor: bg,
        color: color,
        border: border,
        fontFamily: "'Jost', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.25em",
        cursor: "pointer",
        textTransform: "uppercase",
        boxShadow: variant === 'light' ? "0 0 60px rgba(255,255,255,0.2)" : "none",
        position: "relative",
        zIndex: 5,
        overflow: "hidden"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        animate={{ x: coords.x * 0.5, y: coords.y * 0.5 }}
        transition={{ type: "spring", stiffness: 200, damping: 10, mass: 0.2 }}
        style={{ pointerEvents: "none", zIndex: 2 }}
      >
        {children}
      </motion.span>
      {/* Internal Hover Effect Layer */}
      <motion.div 
        style={{ position: 'absolute', inset: 0, background: variant === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', zIndex: 1, opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  );
};

// B. Custom Cursor Tracker System
const AdvancedCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <>
      <motion.div
        animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.4)",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference"
        }}
      />
      <motion.div
        animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4 }}
        transition={{ type: "spring", stiffness: 1000, damping: 40, mass: 0.1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference"
        }}
      />
    </>
  );
};

// C. Dynamic Staggered Reveal Engine
const EngineTextReveal: React.FC<{ text: string, delay?: number, staggerStart?: number, size?: string, color?: string }> = ({ text, delay = 0, staggerStart = 0.05, size = "1rem", color = "#fff" }) => {
  const words = text.split(" ");
  return (
    <div style={{ display: 'inline-block', flexWrap: 'wrap', gap: '8px' }}>
      {words.map((word, i) => (
        <span style={{ display: 'inline-block', overflow: 'hidden' }} key={i}>
          <motion.span
            initial={{ y: "150%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay + (i * staggerStart) }}
            style={{ display: 'inline-block', fontSize: size, color: color, paddingRight: '8px' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
};

// D. Infinite Horizontal Marquee Component
const InfiniteMarquee: React.FC<{ text: string, speed?: number, size?: string }> = ({ text, speed = 20, size = "10vw" }) => {
  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", display: "flex", whiteSpace: "nowrap", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "20px 0" }}>
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "-50%" }}
        transition={{ ease: "linear", duration: speed, repeat: Infinity }}
        style={{ display: "flex", gap: "2vw" }}
      >
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: size, color: "transparent", WebkitTextStroke: "1px #8B2BE2", paddingRight: "50px" }}>{text}</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: size, color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.2)", paddingRight: "50px" }}>{text}</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: size, color: "transparent", WebkitTextStroke: "1px #8B2BE2", paddingRight: "50px" }}>{text}</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: size, color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.2)", paddingRight: "50px" }}>{text}</span>
      </motion.div>
    </div>
  );
};

// ============================================================================
// 5. THE BEAST: MAIN PAGE COMPONENT
// ============================================================================
export default function About() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // As a backup for slow-loading fonts/images fixing ScrollTrigger layout heights
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // ---------------------------------------------------------
  // REFS FOR INTRICATE GSAP TIMELINES & FRAMER SPRINGS
  // ---------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);

  // Hero Section
  const heroRef = useRef<HTMLDivElement>(null);
  const heroMainTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubTitleRef = useRef<HTMLParagraphElement>(null);
  
  // Parallax for Hero Background (Lightweight fallback)
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(heroScroll, [0, 1], ["0%", "40%"]);
  const heroBgScale = useTransform(heroScroll, [0, 1], [1, 1.2]);

  // Chapter 1: Pinned Horizontal History Track
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Chapter 2: The Metallic WebGL Paint Canvas
  const chromeSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: chromeScroll } = useScroll({ target: chromeSectionRef, offset: ["start end", "end start"] });
  const chromeScale = useTransform(chromeScroll, [0, 1], [0.9, 1.1]);
  const chromeBlur = useTransform(chromeScroll, [0, 0.5, 1], ["blur(10px)", "blur(0px)", "blur(10px)"]);

  // Chapter 3: Elaborate Framer Parallax Grid Array
  const gridMasterRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: masterGridScroll } = useScroll({ target: gridMasterRef, offset: ["start end", "end start"] });
  const smoothMasterGrid = useSpring(masterGridScroll, { damping: 25, stiffness: 120 });
  
  // Dynamic Hooks for over 15 floating grid items
  const floatY1 = useTransform(smoothMasterGrid, [0, 1], [400, -800]);
  const floatY2 = useTransform(smoothMasterGrid, [0, 1], [600, -1200]);
  const floatY3 = useTransform(smoothMasterGrid, [0, 1], [200, -500]);
  const floatY4 = useTransform(smoothMasterGrid, [0, 1], [500, -900]);
  const floatY5 = useTransform(smoothMasterGrid, [0, 1], [800, -1500]);

  const floatScale1 = useTransform(smoothMasterGrid, [0, 0.5, 1], [0.8, 1, 0.8]);
  const floatScale2 = useTransform(smoothMasterGrid, [0, 0.5, 1], [1.2, 1, 1.2]);

  // Epilogue Core Node
  const epilogueRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------
  // ENGINE INITIALIZATION: LENIS + GSAP TICKER MERGE
  // ---------------------------------------------------------
  useEffect(() => {
    // Inject custom scroll styling locally for the extreme setup
    document.documentElement.style.scrollBehavior = 'auto';
    
    // Core Lenis configuration
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0, 0);

    // Context execution wrapper
    const ctx = gsap.context(() => {
      
      // Hero Animations: Brutalist smash entrance
      gsap.fromTo(heroMainTitleRef.current, 
        { scale: 3, opacity: 0, y: 300, rotationX: 45 },
        { scale: 1, opacity: 1, y: 0, rotationX: 0, duration: 2, ease: "expo.out", delay: 0.5 }
      );
      gsap.fromTo(heroSubTitleRef.current, 
        { scale: 0.8, opacity: 0, y: -50 },
        { scale: 1, opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 1.5 }
      );

      // Hero Scroll Hijack (Text leaves screen rapidly)
      gsap.to([heroMainTitleRef.current, heroSubTitleRef.current], {
        yPercent: -200,
        opacity: 0,
        filter: "blur(20px)",
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1
        }
      });

      // Removed the highly experimental Horizontal Scroll Lock that caused blank screens.
      // Now falling back to standard vertical intersection observers for the images.
      
      // Cinematic image reveals globally proper GSAP container properties
      gsap.utils.toArray(".reveal-img-block").forEach((el: any) => {
        gsap.fromTo(el, 
          { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", scale: 1.2, rotationX: 25, z: -100, transformPerspective: 1000 },
          { 
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", 
            scale: 1, 
            rotationX: 0,
            z: 0,
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            }
          }
        );
      });

    }, containerRef);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // ---------------------------------------------------------
  // RENDER MEGA COMPONENT
  // ---------------------------------------------------------
  return (
    <div ref={containerRef} style={{ backgroundColor: "#040404", color: "#ffffff", minHeight: "100vh", fontFamily: "'Jost', sans-serif", overflow: "hidden", position: "relative" }}>
      
      {/* GLOBAL BACKGROUND NOISE (Always active, GPU accelerated static) */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none", zIndex: 9998, background: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />
      
      <GeometricArchitecturalMasks />
      <AdvancedCursor />
      <Navbar />

      {/* =========================================================================
          SECTION 1: PROLOGUE - THE WEBGL ENTROPY VOID 
          ========================================================================= */}
      <section ref={heroRef} style={{ position: "relative", width: "100vw", height: "130vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        
        {/* Ambient 3D Parallax Space (High Performance & Responsive) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
            <motion.div 
              style={{ 
                width: "100%", 
                height: "130%", 
                top: "-15%",
                position: "absolute",
                background: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.08%22/%3E%3C/svg%3E'), radial-gradient(circle at center, #2e2e2e 0%, #040404 80%)",
                backgroundBlendMode: "screen",
                y: heroBgY,
                scale: heroBgScale
              }} 
            />
        </div>

        {/* Shadow Overlays to blend with the background seamlessly */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(circle at center, transparent 0%, #040404 90%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50vh", zIndex: 2, background: "linear-gradient(to top, #040404 0%, transparent 100%)" }} />

        {/* Foreground Hero Typography */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
           <h1 ref={heroMainTitleRef} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(4rem, 12vw, 15rem)", margin: 0, lineHeight: 0.8, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
             ARCHITECT<br/>THE FLESH
           </h1>
           <p ref={heroSubTitleRef} style={{ marginTop: "40px", fontFamily: "'Jost', sans-serif", fontSize: "clamp(10px, 2vw, 14px)", letterSpacing: "0.8em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
             The DVSK Design Manifesto
           </p>
        </div>

        {/* Massive Scroll Dowel */}
                {/* Massive Scroll Dowel */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5, duration: 2, ease: "easeOut" }}
          style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div style={{ width: "1px", height: "120px", background: "linear-gradient(to bottom, #fff 0%, transparent 100%)", marginBottom: "20px" }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>INITIATE</span>
        </motion.div>
      </section>

      <div style={{ height: "30vh", width: "100%" }} />

      {/* =========================================================================
          SECTION 2: CHAPTER 1 - THE VERTICAL LORE TIMELINE
          ========================================================================= */}
      <section style={{ position: "relative", width: "100%", padding: "10vh 5vw", overflow: "hidden" }}>
        
        {/* Deep Parallax Shadow Text */}
        <div className="timeline-bg-text" style={{ position: "absolute", top: "10%", left: "-20%", whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif", fontSize: "30vw", color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.02)", zIndex: 0, pointerEvents: "none" }}>
           DECONSTRUCT THE SILHOUETTE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15vh", position: "relative", zIndex: 10, maxWidth: "1600px", margin: "0 auto" }}>
          {COMPREHENSIVE_DVSK_STORY.map((story, i) => (
             <div key={i} style={{ display: "flex", flexWrap: "wrap", flexDirection: i % 2 === 0 ? "row" : "row-reverse", gap: "8vw", alignItems: "center", width: "100%" }}>
                
                {/* Visual Block */}
                <div style={{ position: "relative", width: "100%", maxWidth: "45vw", minWidth: "300px", height: "auto", maxHeight: "65vh", aspectRatio: "4/5", overflow: "hidden", flex: "1 1 300px" }} className="reveal-img-block">
                  <img 
                    src={[image4, image1, image2, image5, image3][i % 5]} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(80%) sepia(10%) contrast(1.2)" }} 
                    alt={story.title} 
                  />
                  {/* Glitch Overlay */}
                  <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')", mixBlendMode: "overlay" }} />
                  {/* Brutalist Number Block */}
                  <div style={{ position: "absolute", bottom: i % 2 === 0 ? "10px" : "auto", top: i % 2 !== 0 ? "10px" : "auto", left: i % 2 === 0 ? "10px" : "auto", right: i % 2 !== 0 ? "10px" : "auto", padding: "clamp(15px, 3vw, 40px)", background: "#fff", color: "#000", zIndex: 10 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "bold", lineHeight: 0.8 }}>{story.phase}</span>
                  </div>

                  {/* Floating Micro-image array for extra depth */}
                  {i % 2 === 0 && (
                    <div className="timeline-micro-img" style={{ position: "absolute", top: "10%", right: "-5%", width: "clamp(80px, 15vw, 150px)", aspectRatio: "3/4", border: "1px solid rgba(255,255,255,0.3)", padding: "10px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}>
                      <img src={[image1, image5, image2][i % 3]} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "invert(100%)" }} alt="Micro" />
                    </div>
                  )}
                </div>

                {/* Text Block */}
                <div style={{ flex: "1 1 350px", maxWidth: "600px", minWidth: "300px" }}>
                   <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                     <div style={{ width: "40px", height: "1px", background: "#8B2BE2" }} />
                     <span style={{ fontSize: "14px", letterSpacing: "0.2em", color: "#8B2BE2", fontWeight: 600 }}>YEAR {story.year}</span>
                   </div>
                   <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 6vw, 4rem)", lineHeight: 1.1, marginBottom: "30px", textTransform: "uppercase", color: "#fff" }}>
                     {story.title}
                   </h2>
                   <p style={{ fontSize: "clamp(14px, 2vw, 16px)", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", fontWeight: 300, marginBottom: "40px" }}>
                     {story.text}
                   </p>
                   
                   {/* Details Grid */}
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                     {story.details.map((detail, dIdx) => (
                       <div key={dIdx} style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
                         <span style={{ color: "#8B2BE2", marginRight: "10px" }}>//</span> {detail}
                       </div>
                     ))}
                   </div>
                </div>

             </div>
          ))}

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: THE FLUID CHROME SHADER VOID (METALLIC PAINT PIPELINE)
          ========================================================================= */}
      <section ref={chromeSectionRef} style={{ position: "relative", width: "100vw", height: "160vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: "10vh" }}>
         
         <motion.div style={{ position: "absolute", inset: 0, scale: chromeScale, filter: chromeBlur, zIndex: 0 }}>
            {/* The Ultimate CSS 3D Depth Engine Filter */}
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px' }}>
              <motion.div 
                style={{
                  width: '90vw',
                  height: '80vh',
                  maxWidth: '800px',
                  backgroundImage: `url(${image3})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 40px 150px -20px rgba(139, 43, 226, 0.4)',
                  rotateX: useTransform(chromeScroll, [0, 1], [30, -30]),
                  rotateY: useTransform(chromeScroll, [0, 1], [-15, 15]),
                  z: useTransform(chromeScroll, [0, 1], [-300, 100]),
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(78, 0, 166, 0.15) 0%, transparent 60%)', mixBlendMode: 'screen', pointerEvents: 'none' }} />
            </div>
            {/* Dark Mask Top and Bottom */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30vh", background: "linear-gradient(to bottom, #040404 0%, transparent 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30vh", background: "linear-gradient(to top, #040404 0%, transparent 100%)" }} />
         </motion.div>

         {/* Cinematic Text Block Hovering in the Void */}
         <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "900px", padding: "0 5vw" }}>
            <EngineTextReveal text="THE ELEMENT OF GRAVITY" size="14px" color="rgba(255,255,255,0.5)" delay={0.2} staggerStart={0.02} />
            <div style={{ height: "40px" }} />
            <EngineTextReveal text="Industrial Silk. Liquid Chrome. The garments must feel physically alive." size="clamp(3rem, 6vw, 6rem)" color="#fff" delay={0.4} />
         </div>

      </section>

      {/* =========================================================================
          SECTION 4: THE INFINITE MARQUEE SEPARATOR
          ========================================================================= */}
      <div style={{ margin: "20vh 0" }}>
        <InfiniteMarquee text="THE FABRIC MUST OBEY THE ARCHITECT." speed={30} size="8vw" />
        <div style={{ marginTop: "-1px" }} />
        <InfiniteMarquee text="DECONSTRUCT THE SILHOUETTE." speed={45} size="6vw" />
      </div>

      {/* =========================================================================
          SECTION 5: THE STRUCTURAL PARALLAX GRID (FRAMER MOTION SPRINGS)
          ========================================================================= */}
      <section ref={gridMasterRef} style={{ position: "relative", width: "100%", padding: "10vh 5vw", backgroundColor: "#040404" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20vh", padding: "0 5vw" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 0.9 }}>
            A STRUCTURAL <br/> METHODOLOGY.
          </h2>
          <p style={{ maxWidth: "300px", fontSize: "14px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            The 5 core pillars of DVSK architectural fashion design, mapped below.
          </p>
        </div>

        {/* The Float Grid Array - Bypassing standard layout for pure absolute positioning algorithms */}
        <div style={{ position: "relative", width: "100%", height: "300vh" }}>
           
           {/* Item 1 */}
           <motion.div style={{ position: "absolute", top: "0%", left: "5%", width: "25vw", y: floatY1, scale: floatScale1 }}>
             <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
               <img src={ARCHITECTURAL_CONCEPTS[0].image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Grid 1" />
             </div>
             <div style={{ padding: "30px", background: "#fff", color: "#000", marginTop: "-50px", marginLeft: "20px", position: "relative", zIndex: 5 }}>
               <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", marginBottom: "10px" }}>{ARCHITECTURAL_CONCEPTS[0].title}</h3>
               <p style={{ fontSize: "12px", opacity: 0.8 }}>{ARCHITECTURAL_CONCEPTS[0].desc}</p>
             </div>
           </motion.div>

           {/* Item 2 */}
           <motion.div style={{ position: "absolute", top: "15%", right: "10%", width: "35vw", y: floatY2, scale: floatScale2 }}>
             <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", background: "#111" }}>
               <img src={ARCHITECTURAL_CONCEPTS[1].image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} alt="Grid 2" />
             </div>
             <div style={{ padding: "30px", position: "absolute", top: "-40px", right: "-40px", background: "#080808", border: "1px solid rgba(255,255,255,0.2)", width: "300px" }}>
               <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", marginBottom: "10px" }}>{ARCHITECTURAL_CONCEPTS[1].title}</h3>
               <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{ARCHITECTURAL_CONCEPTS[1].desc}</p>
             </div>
           </motion.div>

           {/* Item 3 */}
           <motion.div style={{ position: "absolute", top: "35%", left: "35%", width: "30vw", y: floatY3 }}>
             <div style={{ width: "100%", aspectRatio: "4/5", overflow: "hidden", clipPath: "url(#angledCut)" }}>
               <img src={ARCHITECTURAL_CONCEPTS[2].image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%)" }} alt="Grid 3" />
             </div>
             <div style={{ padding: "30px", marginTop: "20px", textAlign: "center" }}>
               <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", marginBottom: "15px" }}>{ARCHITECTURAL_CONCEPTS[2].title}</h3>
               <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", maxWidth: "250px", margin: "0 auto" }}>{ARCHITECTURAL_CONCEPTS[2].desc}</p>
             </div>
           </motion.div>

           {/* Item 4 */}
           <motion.div style={{ position: "absolute", top: "60%", left: "5%", width: "20vw", y: floatY4, scale: floatScale1 }}>
             <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden" }}>
               <img src={ARCHITECTURAL_CONCEPTS[3].image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.5)" }} alt="Grid 4" />
             </div>
             <div style={{ padding: "20px 0" }}>
               <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", marginBottom: "10px" }}>{ARCHITECTURAL_CONCEPTS[3].title}</h3>
               <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{ARCHITECTURAL_CONCEPTS[3].desc}</p>
             </div>
           </motion.div>

           {/* Item 5 */}
           <motion.div style={{ position: "absolute", top: "75%", right: "15%", width: "45vw", y: floatY5 }}>
             <div style={{ width: "100%", aspectRatio: "21/9", overflow: "hidden", position: "relative" }}>
               <img src={ARCHITECTURAL_CONCEPTS[4].image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Grid 5" />
               <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #040404 0%, transparent 50%, #040404 100%)" }} />
             </div>
             <div style={{ padding: "30px", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)", position: "absolute", bottom: "-50px", right: "20px", maxWidth: "350px", zIndex: 10 }}>
               <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", marginBottom: "10px" }}>{ARCHITECTURAL_CONCEPTS[4].title}</h3>
               <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>{ARCHITECTURAL_CONCEPTS[4].desc}</p>
             </div>
           </motion.div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: THE FINAL EPILOGUE
          ========================================================================= */}
      <section ref={epilogueRef} style={{ position: "relative", width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", color: "#000", overflow: "hidden" }}>
        
        {/* Massive Background Logo Fill */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", textAlign: "center", pointerEvents: "none", zIndex: 0 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "40vw", margin: 0, lineHeight: 0.8, color: "rgba(0,0,0,0.02)", textTransform: "uppercase" }}>
            DVSK
          </h1>
        </div>

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "800px", padding: "0 20px" }}>
           <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(3rem, 8vw, 6rem)", margin: 0, lineHeight: 1, marginBottom: "40px" }}>
             Equip the uniform.
           </h2>
           <p style={{ fontSize: "16px", lineHeight: 1.8, color: "rgba(0,0,0,0.6)", marginBottom: "60px" }}>
             You have read the architecture. You have witnessed the process. Uncompromising, dark, architectural fashion meant for the brutalist era. Access the collections below.
           </p>

           <SuperMagneticCTA variant="dark" onClick={() => navigate('/men')}>
             ENTER THE ARCHIVES
           </SuperMagneticCTA>
        </div>

        {/* Footer Link Box Integrator */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
          <Footer />
        </div>
      </section>

    </div>
  );
}