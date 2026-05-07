import { useEffect, useRef, useState, useCallback, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Search, X, Star, Loader2, LogOut, User as UserIcon, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import CartSidebar from './CartSidebar';
import WishlistSidebar from './WishlistSidebar';
import { useCart } from '../context/CartContext';
import { searchApi } from '../api/search';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';

// ─── Set your logo path here ──────────────────────────────────────────────────
import logo from '../assets/Secondary_logo.svg';
const LOGO_SRC = logo;



// ─── Menu items ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: 'Women', ariaLabel: 'Go to Women', link: '/women' },
  { label: 'Men', ariaLabel: 'Go to Men', link: '/men' },
  { label: 'Accessories', ariaLabel: 'Go to Accessories', link: '/accessories' },
  { label: 'About', ariaLabel: 'Go to About', link: '/about' },
  { label: 'Campaigns', ariaLabel: 'Go to Campaigns', link: '/campaigns' },
  { label: 'Services', ariaLabel: 'Go to Client Services', link: '/services' },
];

const MENU_SOCIALS = [
  { label: 'Instagram', link: 'https://instagram.com' },
  { label: 'Pinterest', link: 'https://pinterest.com' },
];

const NAVBAR_HEIGHT = 72;



// ═════════════════════════════════════════════════════════════════════════════
// STAGGERED MENU
// ═════════════════════════════════════════════════════════════════════════════

interface StaggeredMenuItem { label: string; ariaLabel: string; link: string; }
interface StaggeredMenuSocialItem { label: string; link: string; }

interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  accentColor?: string;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

function StaggeredMenu({
  position = 'left',
  colors = ['#c1beb69f', '#C1BEB6'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = false,
  accentColor = '#97948D',
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const [textLines, setTextLines] = useState(['Menu', 'Close']);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const btnWrapRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
    });
    return () => ctx.revert();
  }, [position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as any]: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(panel, { xPercent: panelStart }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1 } }, itemsStart);
      if (numberEls.length) tl.to(numberEls, { duration: 0.6, ease: 'power2.out', ['--sm-num-opacity' as any]: 1, stagger: { each: 0.08 } }, itemsStart + 0.1);
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08 } }, socialsStart + 0.04);
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;

    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const iEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (iEls.length) gsap.set(iEls, { yPercent: 140, rotate: 10 });
        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current, h = plusHRef.current, v = plusVRef.current;
    if (!icon || !h || !v) return;
    spinTweenRef.current?.kill();
    if (opening) {
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power4.out', duration: 0.45 } })
        .to(h, { rotate: 45 }, 0)
        .to(v, { rotate: -45 }, 0);
    } else {
      spinTweenRef.current = gsap.timeline({ defaults: { ease: 'power3.inOut', duration: 0.35 } })
        .to(h, { rotate: 0 }, 0)
        .to(v, { rotate: 90 }, 0);
    }
  }, []);

  const animateButton = useCallback((opening: boolean) => {
    const wrap = btnWrapRef.current;
    const panel = panelRef.current;
    if (!wrap) return;

    let targetX = 0;
    if (opening && panel) {
      const panelWidth = panel.offsetWidth;
      const btnRect = wrap.getBoundingClientRect();
      targetX = panelWidth - btnRect.left + 16;
    }

    gsap.to(wrap, {
      x: targetX,
      duration: opening ? 0.55 : 0.32,
      ease: opening ? 'power4.out' : 'power3.in',
    });
  }, []);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) { last = last === 'Menu' ? 'Close' : 'Menu'; seq.push(last); }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });
    const finalShift = ((seq.length - 1) / seq.length) * 100;
    textCycleAnimRef.current = gsap.to(inner, { yPercent: -finalShift, duration: 0.5 + seq.length * 0.07, ease: 'power4.out' });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) { onMenuOpen?.(); playOpen(); }
    else { onMenuClose?.(); playClose(); }
    animateIcon(target);
    animateButton(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateButton, animateText, onMenuOpen, onMenuClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(e.target as Node)
      ) {
        openRef.current = false;
        setOpen(false);
        onMenuClose?.();
        playClose();
        animateIcon(false);
        animateButton(false);
        animateText(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, playClose, animateIcon, animateButton, animateText, onMenuClose]);

  return (
    <div
      className="sm-scope relative z-50"
      style={{ accentColor } as React.CSSProperties}
      data-position={position}
      data-open={open || undefined}
    >
      {/* Button wrapper */}
      <div ref={btnWrapRef} style={{ display: 'inline-flex', willChange: 'transform' }}>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={toggleMenu}
          type="button"
        >
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((l, i) => (
                <span className="sm-toggle-line" key={i}>{l}</span>
              ))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={plusHRef} className="sm-icon-line" />
            <span ref={plusVRef} className="sm-icon-line" />
          </span>
        </button>
      </div>

      {/* Pre-layers */}
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors.slice(0, 4);
          let arr = [...raw];
          if (arr.length >= 3) arr.splice(Math.floor(arr.length / 2), 1);
          return arr.map((c, i) => (
            <div key={i} className="sm-prelayer" style={{ background: c }} />
          ));
        })()}
      </div>

      {/* Panel */}
      <aside ref={panelRef} className="sm-panel" aria-hidden={!open}>
        {/* Close button — only visible on mobile (≤640px) via CSS below */}
        <button
          type="button"
          className="sm-panel-close"
          aria-label="Close menu"
          onClick={() => toggleMenu()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
          {items.map((it, idx) => (
            <li className="sm-panel-itemWrap" key={it.label + idx}>
              <a className="sm-panel-item" href={it.link} aria-label={it.ariaLabel} data-index={idx + 1}>
                <span className="sm-panel-itemLabel">{it.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {displaySocials && socialItems.length > 0 && (
          <div className="sm-socials">
            <h3 className="sm-socials-title">Socials</h3>
            <ul className="sm-socials-list" role="list">
              {socialItems.map((s, i) => (
                <li key={s.label + i}>
                  <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <style>{`
        .sm-scope {
          --sm-accent: ${accentColor};
          font-family: 'Jost', sans-serif;
        }

        .sm-scope .sm-toggle {
          position: relative; display: inline-flex; align-items: center; gap: 0.5rem;
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,0.82); font-family: 'Jost', sans-serif;
          font-weight: 300; font-size: 12px; letter-spacing: 0.18em;
          text-transform: uppercase; line-height: 1; padding: 0;
          transition: color 0.2s;
          z-index: 10000;
        }
        .sm-scope .sm-toggle:hover { color: #fff; }

        .sm-scope .sm-toggle-textWrap {
          position: relative; display: inline-block;
          height: 1em; overflow: hidden; white-space: nowrap;
        }
        .sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
        .sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }

        .sm-scope .sm-icon {
          position: relative; width: 12px; height: 12px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          will-change: transform;
        }
        .sm-scope .sm-icon-line {
          position: absolute; left: 50%; top: 50%;
          width: 100%; height: 1.5px; background: currentColor;
          border-radius: 2px; transform: translate(-50%, -50%);
          will-change: transform;
        }

        .sm-scope .sm-prelayers {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: clamp(280px, 40vw, 440px);
          pointer-events: none; z-index: 9998;
        }
        .sm-scope .sm-prelayer {
          position: absolute; top: 0; left: 0;
          height: 100%; width: 100%;
        }

        .sm-scope .sm-panel {
          position: fixed; top: 0; left: 0;
          width: clamp(280px, 40vw, 440px); height: 100%;
          background: rgba(4, 4, 4, 0.95);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          padding: 100px 2.5rem 2.5rem;
          overflow-y: auto; z-index: 9999;
          border-right: 0.5px solid rgba(255,255,255,0.08);
        }

        .sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
        .sm-scope .sm-panel-item {
          position: relative; color: rgba(255,255,255,0.85);
          font-family: 'Cormorant Garamond', serif; font-weight: 300;
          font-size: clamp(2.2rem, 4vw, 3rem);
          cursor: pointer; line-height: 1; letter-spacing: -1px;
          text-transform: uppercase; display: inline-block;
          text-decoration: none; padding-right: 1.2em;
          transition: color 0.2s ease;
        }
        .sm-scope .sm-panel-item:hover { color: #ffffff; }
        .sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }

        .sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
        .sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after {
          counter-increment: smItem;
          content: counter(smItem, decimal-leading-zero);
          position: absolute; top: 0.1em; right: 0;
          font-size: 14px; font-weight: 300;
          font-family: 'Jost', sans-serif;
          color: var(--sm-accent); letter-spacing: 0;
          pointer-events: none; user-select: none;
          opacity: var(--sm-num-opacity, 0);
        }

        .sm-scope .sm-socials { margin-top: 4rem; border-top: 0.5px solid rgba(255,255,255,0.1); padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .sm-scope .sm-socials-title { margin: 0; font-size: 10px; font-weight: 300; letter-spacing: 0.3em; text-transform: uppercase; color: var(--sm-accent); font-family: 'Jost', sans-serif; }
        .sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .sm-scope .sm-socials-link { font-size: 13px; font-weight: 300; color: rgba(255,255,255,0.5); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; font-family: 'Jost', sans-serif; }
        .sm-scope .sm-socials-link:hover { color: #fff; }

        /* Close button inside the panel — hidden on desktop, shown on mobile */
        .sm-scope .sm-panel-close {
          display: none;
        }
        @media (max-width: 640px) {
          .sm-scope .sm-prelayers,
          .sm-scope .sm-panel { width: 100%; }
          .sm-scope .sm-panel { padding: 80px 1.5rem 2rem; }
          .sm-scope .sm-panel-item { font-size: clamp(2rem, 8vw, 3rem); }
          .sm-scope .sm-panel-close {
            display: flex;
            position: absolute;
            top: 22px;
            right: 22px;
            width: 40px;
            height: 40px;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.04);
            border: 0.5px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            color: rgba(255,255,255,0.85);
            cursor: pointer;
            padding: 0;
            transition: background 0.2s, color 0.2s, transform 0.2s;
            z-index: 10001;
          }
          .sm-scope .sm-panel-close:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// METALLIC PAINT
// ═════════════════════════════════════════════════════════════════════════════

const vertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

const fragmentShader = `#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;
vec3 sC,sM;
vec3 pW(vec3 v){vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);return s*c*((h*16.-4.)*c-1.);}
vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}
vec2 fA(){vec2 c=vP-.5;c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;return vec2(c.x+.5,.5-c.y);}
vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}
float bM(vec2 c,float t){vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);return l.x*l.y*u.x*u.y;}
float mG(float hi,float lo,float t,float sh,float cv){
  sh*=(2.-u_sharp);float ci=smoothstep(.15,.85,cv),r=lo;
  float e1=.08/u_scale;r=mix(r,hi,smoothstep(0.,sh*1.5,t));r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));
  float e2=e1+.05/u_scale*(1.-ci*.35);r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));
  float e3=e2+.025/u_scale*(1.-ci*.45);r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));
  float e4=e1+.1/u_scale;r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));
  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));
  return r;
}
void main(){
  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;sM=fract(sC.zxy-sC.yzx*1.618);
  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);float angleRad=u_angle*3.14159/180.;
  sc=rot(sc-.5,angleRad)+.5;sc=clamp(sc,0.,1.);
  float sl=sc.x-sc.y,an=u_time*.001;vec2 iC=fA();
  vec4 ts=texture(u_tex,iC);float dp=ts.r,shapeMask=ts.a;
  vec3 hi=u_lightColor*u_bright,lo=u_darkColor*(2.-u_bright);
  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
  vec2 fC=sc-.5;float rd=length(fC+vec2(0.,sl*.15));
  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);
  float cv=1.-pow(rd*1.65,1.15);cv*=pow(sc.y,.35);
  float vs=shapeMask;vs*=bM(iC,.01);float fr=pow(1.-cv,u_fresnel)*.3;vs=min(vs+fr*vs,1.);
  float mT=an*.0625;vec3 wO=vec3(-1.05,1.35,1.55);
  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
  vec2 nC=sc*45.*u_noise;nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;
  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;tC=lM(sC,tC);tC=lM(sC+1.618,tC);
  float tb=sin(tC.x*3.14159)*.5+.5;tb=tb*2.-1.;
  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
  float lD=dp+(1.-dp)*u_liquid*tb;lD+=noiseVal*u_distort*.15*edgeFactor;
  float rB=clamp(1.-cv,0.,1.);float fl=ag.x+sl;fl+=noiseVal*sl*u_distort*edgeFactor;
  fl*=mix(1.,1.-dp*.5,u_contour);fl-=dp*u_contour*.8;
  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);fl-=tb*sl*1.8*eI;
  float cA=cv*clamp(pow(sc.y,.12),.25,1.);fl*=.12+(1.05-lD)*cA;fl*=smoothstep(1.,.65,lD);
  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);
  fl+=vA1*.16+vA2*.025;fl*=.45+pow(sc.y,2.)*.55;fl*=u_scale;fl-=an;
  float rO=rB+cv*tb*.025;float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);
  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);rO+=vM1*cM1*4.5;rO-=sl;
  float bO=rB*1.25;float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);
  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);bO+=vM2*cM2*.9;bO-=lD*.18;
  rO*=u_refract*u_chroma;bO*=u_refract*u_chroma;float sf=u_blur;
  float rP=fract(fl+rO);float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);
  float gP=fract(fl);float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);
  float bP=fract(fl-bO);float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
  vec3 col=vec3(rC,gC,bC);col=(col-.5)*u_contrast+.5;col=clamp(col,0.,1.);
  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);
  col=clamp(col,0.,1.);oC=vec4(col*vs,vs);
}`;

interface MetallicPaintProps {
  imageSrc: string;
  seed?: number; scale?: number; refraction?: number; blur?: number;
  liquid?: number; speed?: number; brightness?: number; contrast?: number;
  angle?: number; fresnel?: number; lightColor?: string; darkColor?: string;
  patternSharpness?: number; waveAmplitude?: number; noiseScale?: number;
  chromaticSpread?: number; mouseAnimation?: boolean; distortion?: number;
  contour?: number; tintColor?: string;
}

function processImage(img: HTMLImageElement): ImageData {
  const MAX_SIZE = 1000, MIN_SIZE = 500;
  let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  if (w > MAX_SIZE || h > MAX_SIZE || w < MIN_SIZE || h < MIN_SIZE) {
    const s = w > h ? (w > MAX_SIZE ? MAX_SIZE / w : w < MIN_SIZE ? MIN_SIZE / w : 1) : (h > MAX_SIZE ? MAX_SIZE / h : h < MIN_SIZE ? MIN_SIZE / h : 1);
    w = Math.round(w * s); h = Math.round(h * s);
  }
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!; ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h), data = imgData.data, size = w * h;
  const alphaValues = new Float32Array(size), shapeMask = new Uint8Array(size), boundaryMask = new Uint8Array(size);
  for (let i = 0; i < size; i++) { const x = i * 4, r = data[x], g = data[x + 1], b = data[x + 2], a = data[x + 3]; const isBg = (r > 250 && g > 250 && b > 250 && a === 255) || a < 5; alphaValues[i] = isBg ? 0 : a / 255; shapeMask[i] = alphaValues[i] > 0.1 ? 1 : 0; }
  for (let y = 0; y < h; y++)for (let x = 0; x < w; x++) { const idx = y * w + x; if (!shapeMask[idx]) continue; if (x === 0 || x === w - 1 || y === 0 || y === h - 1 || !shapeMask[idx - 1] || !shapeMask[idx + 1] || !shapeMask[idx - w] || !shapeMask[idx + w]) boundaryMask[idx] = 1; }
  const u = new Float32Array(size);
  for (let iter = 0; iter < 200; iter++)for (let y = 1; y < h - 1; y++)for (let x = 1; x < w - 1; x++) { const idx = y * w + x; if (!shapeMask[idx] || boundaryMask[idx]) continue; const sum = (shapeMask[idx + 1] ? u[idx + 1] : 0) + (shapeMask[idx - 1] ? u[idx - 1] : 0) + (shapeMask[idx + w] ? u[idx + w] : 0) + (shapeMask[idx - w] ? u[idx - w] : 0); u[idx] = 1.85 * ((0.01 + sum) / 4) + (1 - 1.85) * u[idx]; }
  let maxVal = 0; for (let i = 0; i < size; i++)if (u[i] > maxVal) maxVal = u[i]; if (maxVal === 0) maxVal = 1;
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < size; i++) { const px = i * 4, depth = u[i] / maxVal, gray = Math.round(255 * (1 - depth * depth)); out.data[px] = out.data[px + 1] = out.data[px + 2] = gray; out.data[px + 3] = Math.round(alphaValues[i] * 255); }
  return out;
}

function hexToRgb(hex: string): [number, number, number] { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255] : [1, 1, 1]; }

function MetallicPaint({ imageSrc, seed = 42, scale = 4, refraction = 0.01, blur = 0.015, liquid = 0.75, speed = 0.3, brightness = 2, contrast = 0.5, angle = 0, fresnel = 1, lightColor = '#ffffff', darkColor = '#000000', patternSharpness = 1, waveAmplitude = 1, noiseScale = 0.5, chromaticSpread = 2, mouseAnimation = false, distortion = 1, contour = 0.2, tintColor = '#feb3ff' }: MetallicPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null), glRef = useRef<WebGL2RenderingContext | null>(null), uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({}), textureRef = useRef<WebGLTexture | null>(null), animTimeRef = useRef(0), lastTimeRef = useRef(0), rafRef = useRef<number | null>(null), speedRef = useRef(speed), mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 }), mouseAnimRef = useRef(mouseAnimation);
  const [ready, setReady] = useState(false), [textureReady, setTextureReady] = useState(false);
  useEffect(() => { speedRef.current = speed; }, [speed]); useEffect(() => { mouseAnimRef.current = mouseAnimation; }, [mouseAnimation]);
  const initGL = useCallback(() => { const canvas = canvasRef.current; if (!canvas) return false; const gl = canvas.getContext('webgl2', { antialias: true, alpha: true }); if (!gl) return false; const compile = (src: string, type: number) => { const s = gl.createShader(type); if (!s) return null; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; }; const vs = compile(vertexShader, gl.VERTEX_SHADER), fs = compile(fragmentShader, gl.FRAGMENT_SHADER); if (!vs || !fs) return false; const prog = gl.createProgram(); if (!prog) return false; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false; } const uniforms: Record<string, WebGLUniformLocation | null> = {}; const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); for (let i = 0; i < count; i++) { const info = gl.getActiveUniform(prog, i); if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name); } gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.useProgram(prog); const pos = gl.getAttribLocation(prog, 'a_position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0); glRef.current = gl; uniformsRef.current = uniforms; return true; }, []);
  const uploadTexture = useCallback((imgData: ImageData) => { const gl = glRef.current, u = uniformsRef.current; if (!gl || !imgData) return; if (textureRef.current) gl.deleteTexture(textureRef.current); const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imgData.width, imgData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imgData.data); gl.uniform1i(u.u_tex, 0); gl.uniform1f(u.u_imgRatio, imgData.width / imgData.height); gl.uniform1f(u.u_ratio, 1); textureRef.current = tex; }, []);
  useEffect(() => { if (!initGL()) return; const canvas = canvasRef.current, gl = glRef.current; if (!canvas || !gl) return; const side = 1000 * devicePixelRatio; canvas.width = side; canvas.height = side; gl.viewport(0, 0, side, side); setReady(true); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); if (textureRef.current && glRef.current) glRef.current.deleteTexture(textureRef.current); }; }, [initGL]);
  useEffect(() => { if (!ready || !imageSrc) return; setTextureReady(false); const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { uploadTexture(processImage(img)); setTextureReady(true); }; img.src = imageSrc; }, [ready, imageSrc, uploadTexture]);
  useEffect(() => { const gl = glRef.current, u = uniformsRef.current; if (!gl || !ready) return; gl.uniform1f(u.u_seed, seed); gl.uniform1f(u.u_scale, scale); gl.uniform1f(u.u_refract, refraction); gl.uniform1f(u.u_blur, blur); gl.uniform1f(u.u_liquid, liquid); gl.uniform1f(u.u_bright, brightness); gl.uniform1f(u.u_contrast, contrast); gl.uniform1f(u.u_angle, angle); gl.uniform1f(u.u_fresnel, fresnel); const l = hexToRgb(lightColor), d = hexToRgb(darkColor), t = hexToRgb(tintColor); gl.uniform3f(u.u_lightColor, l[0], l[1], l[2]); gl.uniform3f(u.u_darkColor, d[0], d[1], d[2]); gl.uniform1f(u.u_sharp, patternSharpness); gl.uniform1f(u.u_wave, waveAmplitude); gl.uniform1f(u.u_noise, noiseScale); gl.uniform1f(u.u_chroma, chromaticSpread); gl.uniform1f(u.u_distort, distortion); gl.uniform1f(u.u_contour, contour); gl.uniform3f(u.u_tint, t[0], t[1], t[2]); }, [ready, seed, scale, refraction, blur, liquid, brightness, contrast, angle, fresnel, lightColor, darkColor, patternSharpness, waveAmplitude, noiseScale, chromaticSpread, distortion, contour, tintColor]);
  useEffect(() => { if (!ready || !textureReady) return; const gl = glRef.current, u = uniformsRef.current, canvas = canvasRef.current, mouse = mouseRef.current; if (!gl || !canvas) return; const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.targetX = (e.clientX - r.left) / r.width; mouse.targetY = (e.clientY - r.top) / r.height; }; canvas.addEventListener('mousemove', onMove); const render = (time: number) => { const delta = time - lastTimeRef.current; lastTimeRef.current = time; if (mouseAnimRef.current) { mouse.x += (mouse.targetX - mouse.x) * .08; mouse.y += (mouse.targetY - mouse.y) * .08; animTimeRef.current = mouse.x * 3000 + mouse.y * 1500; } else { animTimeRef.current += delta * speedRef.current; } gl.uniform1f(u.u_time, animTimeRef.current); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); rafRef.current = requestAnimationFrame(render); }; lastTimeRef.current = performance.now(); rafRef.current = requestAnimationFrame(render); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); canvas.removeEventListener('mousemove', onMove); }; }, [ready, textureReady]);
  return <canvas ref={canvasRef} className="block h-full w-full object-contain" />;
}

// ═════════════════════════════════════════════════════════════════════════════
// GLASS SURFACE
// ═════════════════════════════════════════════════════════════════════════════

const useDarkMode = () => { const [isDark, setIsDark] = useState(false); useEffect(() => { if (typeof window === 'undefined') return; const mq = window.matchMedia('(prefers-color-scheme: dark)'); setIsDark(mq.matches); const h = (e: MediaQueryListEvent) => setIsDark(e.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, []); return isDark; };

interface GlassSurfaceProps { children?: React.ReactNode; width?: number | string; height?: number | string; borderRadius?: number; borderWidth?: number; brightness?: number; opacity?: number; blur?: number; displace?: number; backgroundOpacity?: number; saturation?: number; distortionScale?: number; redOffset?: number; greenOffset?: number; blueOffset?: number; xChannel?: 'R' | 'G' | 'B'; yChannel?: 'R' | 'G' | 'B'; mixBlendMode?: string; className?: string; style?: React.CSSProperties; }

function GlassSurface({ children, width = 200, height = 80, borderRadius = 20, borderWidth = 0.07, brightness = 50, opacity = 0.93, blur = 11, displace = 0, backgroundOpacity = 0, saturation = 1, distortionScale = -180, redOffset = 0, greenOffset = 10, blueOffset = 20, xChannel = 'R', yChannel = 'G', mixBlendMode = 'difference', className = '', style = {} }: GlassSurfaceProps) {
  const uid = useId().replace(/:/g, '-'); const filterId = `glass-filter-${uid}`, redGradId = `red-grad-${uid}`, blueGradId = `blue-grad-${uid}`;
  const [svgSupported, setSvgSupported] = useState(false); const containerRef = useRef<HTMLDivElement>(null), feImageRef = useRef<SVGFEImageElement>(null), redChannelRef = useRef<SVGFEDisplacementMapElement>(null), greenChannelRef = useRef<SVGFEDisplacementMapElement>(null), blueChannelRef = useRef<SVGFEDisplacementMapElement>(null), gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null); const isDarkMode = useDarkMode();
  const genMap = () => { const rect = containerRef.current?.getBoundingClientRect(); const aw = rect?.width || 400, ah = rect?.height || 200, edge = Math.min(aw, ah) * (borderWidth * 0.5); return `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 ${aw} ${ah}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect x="0" y="0" width="${aw}" height="${ah}" fill="black"/><rect x="0" y="0" width="${aw}" height="${ah}" rx="${borderRadius}" fill="url(#${redGradId})"/><rect x="0" y="0" width="${aw}" height="${ah}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${aw - edge * 2}" height="${ah - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`)}` };
  const updateMap = () => { feImageRef.current?.setAttribute('href', genMap()); };
  const supportsSVG = () => { if (typeof window === 'undefined' || typeof document === 'undefined') return false; if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) return false; if (/Firefox/.test(navigator.userAgent)) return false; const div = document.createElement('div'); div.style.backdropFilter = `url(#${filterId})`; return div.style.backdropFilter !== ''; };
  const supportsBDF = () => typeof window !== 'undefined' && CSS.supports('backdrop-filter', 'blur(10px)');
  useEffect(() => { updateMap();[{ ref: redChannelRef, offset: redOffset }, { ref: greenChannelRef, offset: greenOffset }, { ref: blueChannelRef, offset: blueOffset }].forEach(({ ref, offset }) => { if (ref.current) { ref.current.setAttribute('scale', (distortionScale + offset).toString()); ref.current.setAttribute('xChannelSelector', xChannel); ref.current.setAttribute('yChannelSelector', yChannel); } }); gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString()); }, [width, height, borderRadius, borderWidth, brightness, opacity, blur, displace, distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, mixBlendMode]);
  useEffect(() => { setSvgSupported(supportsSVG()); }, []);
  useEffect(() => { if (!containerRef.current) return; const ro = new ResizeObserver(() => setTimeout(updateMap, 0)); ro.observe(containerRef.current); return () => ro.disconnect(); }, []);
  useEffect(() => { setTimeout(updateMap, 0); }, [width, height]);
  const getStyles = (): React.CSSProperties => { const base: React.CSSProperties = { ...style, width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, borderRadius: `${borderRadius}px` }; if (svgSupported) return { ...base, background: isDarkMode ? `hsl(0 0% 0% / ${backgroundOpacity})` : `hsl(0 0% 100% / ${backgroundOpacity})`, backdropFilter: `url(#${filterId}) saturate(${saturation})`, boxShadow: 'none' }; const bdf = supportsBDF(); if (isDarkMode) return bdf ? { ...base, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)' } : { ...base, background: 'rgba(0,0,0,0.4)' }; return bdf ? { ...base, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px) saturate(1.5)', WebkitBackdropFilter: 'blur(20px) saturate(1.5)' } : { ...base, background: 'rgba(255,255,255,0.2)' }; };
  return (<div ref={containerRef} className={`relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out ${className}`} style={getStyles()}><svg className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10" xmlns="http://www.w3.org/2000/svg"><defs><filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%"><feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" /><feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" /><feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" /><feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" /><feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" /><feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" /><feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" /><feBlend in="red" in2="green" mode="screen" result="rg" /><feBlend in="rg" in2="blue" mode="screen" result="output" /><feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" /></filter></defs></svg><div className="w-full h-full flex items-center justify-center p-2 rounded-[inherit] relative z-10">{children}</div></div>);
}

// ═════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═════════════════════════════════════════════════════════════════════════════

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ name: string; slug: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount: cartCount } = useCart();
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const navigate = useNavigate(); // ← fixed
  const searchRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Track Firebase auth state so the user icon can show the right action:
  // logged out → click goes to /account login page
  // logged in  → click opens an account dropdown with Profile + Logout
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Close the account dropdown when the user clicks outside it
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    try {
      await signOut(auth);
      // Wipe the cached Firebase token so subsequent API calls fail cleanly
      // and the user lands on the public home view.
      localStorage.removeItem('dvsk_auth_token');
      navigate('/home');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Friendly display name + email for the dropdown header
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || currentUser?.phoneNumber || 'Account';
  const displayContact = currentUser?.email || currentUser?.phoneNumber || '';
  const initials = (currentUser?.displayName || currentUser?.email || 'U')
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    // Multi-source scroll detection. Lenis (smooth-scroll lib used in this
    // project) animates scroll over 1.2s, so by the time `window.scrollY`
    // reflects a change, the user has felt the lag. We instead listen to
    // the *input* events directly (wheel + touch) and react instantly,
    // while RAF polling acts as a backup for any other scroll mechanism.
    const TOP_ZONE = 80;
    let rafId = 0;
    let prevY = window.scrollY;
    let touchStartY = 0;

    const showNavbar = () => setHidden((h) => (h ? false : h));
    const hideNavbar = () => setHidden((h) => (h ? h : true));

    const update = (direction: 1 | -1 | 0) => {
      const y = window.scrollY;
      setScrolled((p) => (y > 10 ? (p || true) : false));
      if (y < TOP_ZONE) {
        showNavbar();
      } else if (direction === 1) {
        hideNavbar();
      } else if (direction === -1) {
        showNavbar();
      }
    };

    // ── 1. Wheel events ── fire immediately on desktop, before Lenis even
    //    starts animating. Gives instant feedback on direction.
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) update(1);
      else if (e.deltaY < 0) update(-1);
    };

    // ── 2. Touch events ── for mobile/tablet. Track Y delta during swipe.
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const cy = e.touches[0]?.clientY ?? 0;
      const dy = touchStartY - cy; // swipe up = scrolling down
      if (dy > 5) update(1);
      else if (dy < -5) update(-1);
      touchStartY = cy;
    };

    // ── 3. RAF polling backup ── catches any scroll source we missed
    //    (keyboard arrows, scrollIntoView, anchor jumps, etc.)
    const tick = () => {
      const y = window.scrollY;
      const dy = y - prevY;
      if (Math.abs(dy) > 1) {
        update(dy > 0 ? 1 : -1);
      } else if (y < TOP_ZONE) {
        showNavbar();
      }
      prevY = y;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Debounced search API call
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchApi.suggestions(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500&display=swap');

        .nb-root {
          position: fixed; left: 0; right: 0;
          height: ${NAVBAR_HEIGHT}px; z-index: 1000;
          transition: top 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }
        .nb-root::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 0.5px; z-index: 3;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255,255,255,0.12) 20%,
            rgba(255,255,255,0.22) 50%,
            rgba(255,255,255,0.12) 80%,
            transparent 100%
          );
        }
        .nb-root.scrolled { box-shadow: 0 1px 0 rgba(255,255,255,0.06); }

        .nb-glass {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          z-index: 1;
        }

        .nb-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          height: ${NAVBAR_HEIGHT}px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 clamp(20px, 4vw, 56px);
        }

        .nb-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
        }

        .nb-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nb-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: clamp(8px, 1.5vw, 20px);
        }

        .nb-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(72px, 8vw, 110px);
          height: ${NAVBAR_HEIGHT}px;
          flex-shrink: 0;
          text-decoration: none;
        }

        .nb-icon-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.82);
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          transition: color 0.2s, background 0.2s;
          padding: 0; position: relative; flex-shrink: 0;
        }
        .nb-icon-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

        .nb-cart-badge {
          position: absolute; top: 4px; right: 4px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #8B2BE2; font-size: 6px; color: white;
        }

        /* ── Account dropdown (visible when user is logged in) ── */
        .nb-account-wrap { position: relative; display: inline-flex; }
        .nb-account-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #ffebab 0%, #d4b572 100%);
          color: #0a0a0a; font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: 0.02em;
        }
        .nb-account-dot {
          position: absolute; top: 4px; right: 4px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #34d399; border: 1.5px solid rgba(0,0,0,0.6);
        }
        .nb-account-menu {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 260px; padding: 8px;
          background: rgba(13,13,13,0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          z-index: 1100;
          font-family: 'Jost', sans-serif;
        }
        .nb-account-header {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 8px;
        }
        .nb-account-avatar-lg {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #ffebab 0%, #d4b572 100%);
          color: #0a0a0a; font-size: 14px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nb-account-info { min-width: 0; flex: 1; }
        .nb-account-name {
          font-size: 13px; font-weight: 700; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-account-contact {
          font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nb-account-divider {
          height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0;
        }
        .nb-account-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 10px; border: 0; background: transparent;
          color: rgba(255,255,255,0.85); font-size: 12.5px; font-weight: 500;
          cursor: pointer; border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .nb-account-item:hover { background: rgba(255,235,171,0.08); color: #ffebab; }
        .nb-account-item-danger:hover { background: rgba(255,80,80,0.08); color: #ff8080; }
        .nb-account-item span { flex: 1; }

        .nb-search-overlay {
          position: fixed; top: 0; left: 0; right: 0;
          height: ${NAVBAR_HEIGHT}px; z-index: 1001;
          background: rgba(4,4,4,0.72);
          backdrop-filter: blur(28px) saturate(1.8);
          -webkit-backdrop-filter: blur(28px) saturate(1.8);
          display: flex; align-items: center;
          padding: 0 clamp(20px, 4vw, 56px); gap: 16px;
          transform: translateY(-100%);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .nb-search-overlay.open { transform: translateY(0); }

        .nb-search-input {
          flex: 1; background: none; border: none;
          border-bottom: 0.5px solid rgba(255,255,255,0.25);
          color: #fff; font-family: 'Jost', sans-serif;
          font-weight: 300; font-size: 18px;
          letter-spacing: 0.05em; padding: 8px 0; outline: none;
        }
        .nb-search-input::placeholder {
          color: rgba(255,255,255,0.3); font-size: 14px;
          letter-spacing: 0.12em; text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .nb-inner { padding: 0 16px; }
          .nb-right { gap: 6px; }
          .nb-icon-btn { width: 32px; height: 32px; }
          .nb-logo-wrap { width: 70px; }
        }
        @media (max-width: 480px) {
          .nb-icon-btn { width: 30px; height: 30px; }
          .nb-logo-wrap { width: 56px; }
          /* Keep the account icon visible on tiny screens — without it
             logged-in users have no way to access "Log out". */
          .nb-account-menu { width: 240px; right: -8px; }
        }
      `}</style>

      <nav
        className={`nb-root ${scrolled ? 'scrolled' : 'top'}`}
        style={{ top: hidden ? `-${NAVBAR_HEIGHT * 2}px` : '0px' }}
      >

        <GlassSurface
          className="nb-glass"
          width="100%"
          height={NAVBAR_HEIGHT}
          borderRadius={0}
          borderWidth={0.04}
          brightness={scrolled ? 12 : 6}
          opacity={scrolled ? 0.6 : 0.35}
          blur={scrolled ? 14 : 8}
          backgroundOpacity={scrolled ? 0.04 : 0.01}
          saturation={1.4}
          distortionScale={scrolled ? -100 : -60}
          redOffset={0}
          greenOffset={8}
          blueOffset={16}
          displace={0.5}
          mixBlendMode="difference"
        />

        <div className="nb-inner">

          <div className="nb-left">
            <StaggeredMenu
              position="left"
              colors={['rgba(255,255,255,0.02)', '#111111', '#040404']}
              items={MENU_ITEMS}
              socialItems={MENU_SOCIALS}
              displaySocials={true}
              displayItemNumbering={false}
              accentColor="#97948D"
            />
          </div>

          <div className="nb-center">
            <a href="/home" className="nb-logo-wrap">
              <MetallicPaint
                imageSrc={LOGO_SRC}
                seed={42}
                scale={2}
                patternSharpness={0.2}
                noiseScale={2.5}
                speed={0.45}
                liquid={0.25}
                mouseAnimation={false}
                brightness={2.45}
                contrast={0.52}
                refraction={0.02}
                blur={0.05}
                chromaticSpread={1}
                fresnel={1}
                angle={1}
                waveAmplitude={1}
                distortion={1}
                contour={0.2}
                lightColor="#ffebab"
                darkColor="#080808"
                tintColor="#ffffff"
              />
            </a>
          </div>

          <div className="nb-right">
            <button className="nb-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Open search">
              <Search size={18} strokeWidth={1.5} />
            </button>

            {/* Account button — when logged out, navigates to /account
                login page. When logged in, opens a dropdown with profile
                info + Logout. Watches Firebase auth state to know which
                mode it's in. */}
            <div className="nb-account-wrap" ref={accountMenuRef}>
              <button
                className="nb-icon-btn"
                aria-label="Account"
                onClick={() => {
                  if (currentUser) {
                    setAccountMenuOpen((v) => !v);
                  } else {
                    navigate('/account');
                  }
                }}
              >
                {currentUser ? (
                  <span className="nb-account-avatar">{initials}</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
                {currentUser && <span className="nb-account-dot" aria-hidden />}
              </button>

              <AnimatePresence>
                {accountMenuOpen && currentUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="nb-account-menu"
                  >
                    <div className="nb-account-header">
                      <div className="nb-account-avatar-lg">{initials}</div>
                      <div className="nb-account-info">
                        <div className="nb-account-name">{displayName}</div>
                        {displayContact && <div className="nb-account-contact">{displayContact}</div>}
                      </div>
                    </div>
                    <div className="nb-account-divider" />
                    <button
                      className="nb-account-item"
                      onClick={() => { setAccountMenuOpen(false); navigate('/my-account'); }}
                    >
                      <UserIcon size={15} strokeWidth={1.6} />
                      <span>My Account</span>
                    </button>
                    <button
                      className="nb-account-item"
                      onClick={() => { setAccountMenuOpen(false); navigate('/orders'); }}
                    >
                      <Package size={15} strokeWidth={1.6} />
                      <span>My Orders</span>
                    </button>
                    <div className="nb-account-divider" />
                    <button
                      className="nb-account-item nb-account-item-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} strokeWidth={1.6} />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="nb-icon-btn" aria-label="Open wishlist" onClick={() => setWishlistOpen(true)}>
              <Star size={18} strokeWidth={1.5} />
            </button>

            <button className="nb-icon-btn" aria-label="Open cart" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartCount > 0 && <span className="nb-cart-badge">{cartCount}</span>}
            </button>
          </div>

        </div>
      </nav>

      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className="nb-fs-search"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('nb-fs-search-body')) {
                  setSearchOpen(false);
                }
              }}
            >
              <div className="nb-fs-search-header">
                <button className="nb-icon-btn close-search-btn" onClick={() => setSearchOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff' }}>CLOSE FULLSCREEN</span>
                  <X size={28} strokeWidth={1.5} color="#fff" />
                </button>
              </div>

              <div className="nb-fs-search-body">
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className="nb-fs-search-input-wrap"
                >
                  <Search size={36} strokeWidth={1.5} color="rgba(255,235,171,0.6)" className="nb-search-icon-big" />
                  <input
                    ref={searchRef}
                    className="nb-fs-search-input"
                    type="text"
                    placeholder="Search collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </motion.div>

                <motion.div
                  className="nb-fs-search-suggestions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  <p className="nb-fs-search-title">
                    {searchLoading ? "SEARCHING..." : searchQuery && searchQuery.length >= 2 ? `RESULTS FOR "${searchQuery.toUpperCase()}"` : "Popular"}
                  </p>
                  <div className="nb-fs-search-tags">
                    {searchLoading ? (
                      <Loader2 size={20} color="rgba(255,235,171,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : searchQuery && searchQuery.length >= 2 ? (
                      searchResults.length > 0 ? (
                        searchResults.map((result, i) => (
                          <motion.span
                            key={result.slug}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                            className="nb-fs-tag"
                            onClick={() => { setSearchOpen(false); setSearchQuery(""); navigate(`/product/${result.slug}`); }}
                          >
                            {result.name}
                          </motion.span>
                        ))
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: "'Jost', sans-serif" }}>
                          No results found for "{searchQuery}"
                        </span>
                      )
                    ) : (
                      ['Oversized Tee', 'Cargo Pants', 'Silk Dress', 'Blazer'].map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + (i * 0.1), duration: 0.6 }}
                          className="nb-fs-tag"
                          onClick={() => setSearchQuery(tag)}
                        >
                          {tag}
                        </motion.span>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>

              <style>{`
               .nb-fs-search {
                 position: fixed; inset: 0; z-index: 99999;
                 background: rgba(4,4,4,0.85); display: flex; flex-direction: column;
                 -webkit-backdrop-filter: blur(32px);
               }
               .nb-fs-search-header {
                 display: flex; justify-content: flex-end; padding: clamp(20px, 4vw, 40px);
               }
               .nb-fs-search-body {
                 flex: 1; display: flex; flex-direction: column; justify-content: center;
                 padding: 0 clamp(20px, 8vw, 150px); margin-top: -10vh;
               }
               .nb-fs-search-input-wrap {
                 display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15);
                 padding-bottom: 16px;
               }
               .nb-fs-search-input {
                 flex: 1; background: none; border: none; outline: none; margin-left: 24px;
                 color: #fff; font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 6vw, 76px);
                 line-height: 1; letter-spacing: -0.02em; font-weight: 300;
               }
               .nb-fs-search-input::placeholder { color: rgba(255,255,255,0.2); }
               .nb-fs-search-suggestions { margin-top: 40px; margin-left: 60px; }
               .nb-fs-search-title {
                 font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 0.25em;
                 text-transform: uppercase; color: #ffebab; opacity: 0.7; margin-bottom: 24px;
               }
               .nb-fs-search-tags { display: flex; gap: 16px; flex-wrap: wrap; }
               .nb-fs-tag {
                 font-family: 'Jost', sans-serif; font-size: 13px; color: #fff;
                 padding: 8px 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 100px;
                 transition: all 0.3s ease; cursor: pointer; background: rgba(255,255,255,0.02);
               }
               .nb-fs-tag:hover { background: #fff; color: #080808; border-color: #fff; }
               @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
               
               @media (max-width: 768px) {
                 .nb-fs-search-input-wrap { padding-bottom: 12px; }
                 .nb-fs-search-input { margin-left: 16px; }
                 .nb-search-icon-big { width: 28px; height: 28px; }
                 .nb-fs-search-suggestions { margin-left: 0; margin-top: 32px; }
               }
             `}</style>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistSidebar isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  );
}