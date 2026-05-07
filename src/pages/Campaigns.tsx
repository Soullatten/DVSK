import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Import existing assets for the lookbook
import image1 from '../assets/image01.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image03.png';
import image4 from '../assets/image4.png';
import image5 from '../assets/image7.avif';

gsap.registerPlugin(ScrollTrigger);

const CAMPAIGNS = [
  { id: 1, title: 'SYNTHETIC DAWN', season: 'SS26', img: image4, secondaryImg: image1, desc: 'A descent into biomechanical forms. Exploring the intersection of brutalist concrete architecture and liquid metal fabrics.' },
  { id: 2, title: 'OBLIVION DRAPE', season: 'AW26', img: image2, secondaryImg: image3, desc: 'Heavyweight textiles meeting absolute zero. An uncompromising silhouette built for the urban tundra.' },
  { id: 3, title: 'NEUTRAL ZONE', season: 'CORE', img: image5, secondaryImg: image4, desc: 'Stripped back brutalism. Zero excess. The foundational garments that build the Syndicate.' },
];

export default function Campaigns() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const navigate = useNavigate();

  useEffect(() => {
    // Reveal text blocks and images
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.campaign-reveal').forEach((el: any) => {
        gsap.fromTo(el,
          { y: 60, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
            }
          }
        );
      });
      
      // Line expansion
      gsap.utils.toArray('.campaign-line').forEach((el: any) => {
        gsap.fromTo(el, 
          { width: '0%' },
          { width: '100%', duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="dvsk-page-campaigns" style={{ background: '#030303', minHeight: '300vh', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      
      {/* Return Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ position: 'fixed', top: '40px', left: 'clamp(20px, 5vw, 60px)', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'color 0.3s', zIndex: 1000, mixBlendMode: 'difference' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
      >
        <ArrowLeft size={16} /> Return
      </button>

      {/* Global Grain Filter */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.12, zIndex: 50, pointerEvents: "none", background: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')", mixBlendMode: "overlay" }} />

      {/* Hero Header */}
      <div style={{ height: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40%', fontSize: '200px', fontFamily: "'Cormorant Garamond', serif", opacity: 0.03, color: '#8B2BE2', whiteSpace: 'nowrap', zIndex: 0, pointerEvents: 'none' }}>
           ARCHIVE
        </div>
        
        <h1 className="campaign-reveal" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3.5rem, 10vw, 10rem)', textTransform: 'uppercase', lineHeight: 0.85, textAlign: 'center', zIndex: 10, letterSpacing: '-0.02em' }}>
          Exhibitions<br/>
          <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', letterSpacing: '0.4em', color: '#8B2BE2', display: 'block', marginTop: '30px', fontFamily: "'Jost', sans-serif" }}>DOCUMENTING THE SYNDICATE</span>
        </h1>
        
        <div className="campaign-reveal" style={{ position: 'absolute', bottom: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ height: '60px', width: '1px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', opacity: 0.5, fontFamily: "'Jost', sans-serif" }}>SCROLL</span>
        </div>
      </div>

      {/* Campaign Blocks */}
      <div style={{ paddingBottom: '150px' }}>
        {CAMPAIGNS.map((camp, i) => (
          <div key={camp.id} style={{ minHeight: '120vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: 'clamp(40px, 8vw, 120px) 0' }}>
            
            {/* Background Texture Number */}
            <div style={{ position: 'absolute', top: i % 2 === 0 ? '10%' : '50%', left: i % 2 === 0 ? '-10%' : 'auto', right: i % 2 !== 0 ? '-10%' : 'auto', fontSize: '40vw', fontFamily: "'Cormorant Garamond', serif", color: 'rgba(255,255,255,0.02)', lineHeight: 0.8, pointerEvents: 'none', zIndex: 0 }}>
              0{i+1}
            </div>

            <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(40px, 8vw, 120px)', padding: '0 clamp(20px, 5vw, 60px)', alignItems: 'center', zIndex: 10 }}>
              
              {/* Image Column */}
              <div style={{ order: i % 2 === 0 ? 1 : 2, position: 'relative' }} className="campaign-reveal">
                {/* Main Image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', overflow: 'hidden' }}>
                  <motion.img 
                    src={camp.img} 
                    style={{ 
                      width: '100%', height: '130%', objectFit: 'cover', 
                      y: useTransform(scrollYProgress, [Math.max(0, (i - 1) * 0.33), (i + 1) * 0.33], ['-15%', '15%']),
                      filter: 'grayscale(70%) sepia(10%) contrast(1.1)' 
                    }} 
                    alt={camp.title}
                  />
                </div>
                
                {/* Secondary Offset Image */}
                <div style={{ position: 'absolute', bottom: '-40px', right: i % 2 === 0 ? '-40px' : 'auto', left: i % 2 !== 0 ? '-40px' : 'auto', width: '45%', aspectRatio: '3/4', border: '1px solid rgba(255,255,255,0.1)', background: '#000', padding: '10px' }}>
                   <img src={camp.secondaryImg} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'invert(1)' }} alt="Detail" />
                </div>
              </div>

              {/* Text Column */}
              <div style={{ order: i % 2 === 0 ? 2 : 1, padding: '0 20px', position: 'relative' }}>
                <div className="campaign-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ width: '30px', height: '1px', background: '#8B2BE2' }} />
                  <span style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#8B2BE2', fontWeight: 600, fontFamily: "'Jost', sans-serif" }}>FILE {camp.season}</span>
                </div>
                
                <h2 className="campaign-reveal" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.5rem, 6vw, 6rem)', textTransform: 'uppercase', lineHeight: 0.9, marginBottom: '40px', letterSpacing: '-0.02em' }}>
                  {camp.title}
                </h2>
                
                <div className="campaign-line" style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '40px' }} />
                
                <p className="campaign-reveal" style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', fontWeight: 300, opacity: 0.7, lineHeight: 1.8, letterSpacing: '0.05em', fontFamily: "'Jost', sans-serif", maxWidth: '500px' }}>
                  {camp.desc}
                </p>
                
                <div className="campaign-reveal" style={{ marginTop: '50px' }}>
                  <button 
                    onClick={() => navigate('/men')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '18px 45px', color: '#fff', letterSpacing: '0.2em', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: "'Jost', sans-serif", display: 'inline-flex', alignItems: 'center', gap: '10px' }} 
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }} 
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
                  >
                    View Exhibition <span style={{ fontSize: '14px' }}>→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Mobile-only Campaigns tweaks. Desktop unchanged. */}
      <style>{`
        @media (max-width: 768px) {
          .dvsk-page-campaigns h1 { font-size: clamp(2.6rem, 14vw, 6rem) !important; }
          .dvsk-page-campaigns h2 { font-size: clamp(1.8rem, 8vw, 3rem) !important; }
          .dvsk-page-campaigns p { font-size: 13px !important; line-height: 1.6 !important; }
          .dvsk-page-campaigns > div:nth-child(4) > div {
            min-height: 80vh !important;
            padding: 40px 0 !important;
          }
          .dvsk-page-campaigns > div:nth-child(4) > div > div {
            flex-direction: column !important;
            gap: 24px !important;
            padding: 0 24px !important;
          }
          .dvsk-page-campaigns img { max-height: 60vh !important; }
        }
        @media (max-width: 480px) {
          .dvsk-page-campaigns > div:nth-child(4) > div > div { padding: 0 18px !important; }
          .dvsk-page-campaigns h1 span { font-size: 11px !important; letter-spacing: 0.3em !important; }
        }
      `}</style>
    </div>
  );
}
