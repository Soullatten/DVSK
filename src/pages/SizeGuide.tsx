import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SizeGuide() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="dvsk-page-sizeguide" style={{ backgroundColor: "#020202", color: "#fff", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      <Navbar />

      <main style={{ paddingTop: "150px", paddingBottom: "100px", maxWidth: "1200px", margin: "0 auto", paddingLeft: "clamp(20px, 4vw, 60px)", paddingRight: "clamp(20px, 4vw, 60px)" }}>
        
        {/* Return Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'color 0.3s', marginBottom: '40px' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <ArrowLeft size={16} /> Return to Product
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          
          <div style={{ marginBottom: "60px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", textTransform: "uppercase", lineHeight: 1, marginBottom: "20px" }}>MEASUREMENTS</h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", maxWidth: "600px", lineHeight: 1.6 }}>
              All measurements are taken across the garment while laid flat. Please allow a 1-2cm variance due to the structured tailoring and heavyweight fabrics used in our collections.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px", color: "#fff" }}>// Tops & Outerwear</h2>
            <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", letterSpacing: "0.1em", marginBottom: "60px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #8B2BE2" }}>
                  <th style={{ padding: "20px", color: "#8B2BE2", fontWeight: 400, textTransform: "uppercase" }}>Size</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Shoulder (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Chest (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Length (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Sleeve (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'S / 1', sh: 44, ch: 52, len: 72, slv: 63 },
                  { size: 'M / 2', sh: 46, ch: 55, len: 74, slv: 64 },
                  { size: 'L / 3', sh: 48, ch: 58, len: 76, slv: 65 },
                  { size: 'XL / 4', sh: 50, ch: 61, len: 78, slv: 66 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", transition: "background 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: "20px", color: "#fff", fontWeight: 600 }}>{row.size}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.sh}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.ch}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.len}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.slv}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px", color: "#fff" }}>// Baggy Trousers & Bottoms</h2>
            <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", letterSpacing: "0.1em" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #8B2BE2" }}>
                  <th style={{ padding: "20px", color: "#8B2BE2", fontWeight: 400, textTransform: "uppercase" }}>Size</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Waist (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Inseam (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Outseam (cm)</th>
                  <th style={{ padding: "20px", color: "rgba(255,255,255,0.5)", fontWeight: 400, textTransform: "uppercase" }}>Leg Opening (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'S / 1', wst: 78, in: 77, out: 106, leg: 27 },
                  { size: 'M / 2', wst: 82, in: 79, out: 108, leg: 28 },
                  { size: 'L / 3', wst: 86, in: 81, out: 110, leg: 29 },
                  { size: 'XL / 4', wst: 90, in: 83, out: 112, leg: 30 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", transition: "background 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: "20px", color: "#fff", fontWeight: 600 }}>{row.size}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.wst}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.in}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.out}</td>
                    <td style={{ padding: "20px", color: "rgba(255,255,255,0.7)" }}>{row.leg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "60px", padding: "40px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
              <div>
                <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px", color: "#fff" }}>Measuring Tops</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Shoulder:</strong> Seam to seam across the back.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Chest:</strong> Armpit to armpit across the front.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Length:</strong> Base of collar to the bottom hem.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Sleeve:</strong> Shoulder seam down to the cuff edge.</li>
                </ul>
              </div>
              
              <div>
                <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px", color: "#fff" }}>Measuring Bottoms</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Waist:</strong> Straight across laying flat.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Inseam:</strong> Crotch seam down to the ankle hem.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Outseam:</strong> Top of waistband down to the ankle hem.</li>
                  <li><strong style={{ color: "#8B2BE2", fontWeight: 400 }}>Leg Opening:</strong> Seam to seam across the bottom hem.</li>
                </ul>
              </div>
            </div>
          </div>

        </motion.div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .dvsk-page-sizeguide main { padding-top: 110px !important; }
          .dvsk-page-sizeguide h1 { font-size: clamp(2rem, 9vw, 3rem) !important; }
          .dvsk-page-sizeguide table { font-size: 12px !important; min-width: 480px !important; }
          .dvsk-page-sizeguide th, .dvsk-page-sizeguide td { padding: 12px 14px !important; }
          .dvsk-page-sizeguide ul li { font-size: 13px !important; }
        }
        @media (max-width: 480px) {
          .dvsk-page-sizeguide main { padding-left: 18px !important; padding-right: 18px !important; }
          .dvsk-page-sizeguide table { font-size: 11px !important; }
          .dvsk-page-sizeguide th, .dvsk-page-sizeguide td { padding: 10px 12px !important; }
        }
      `}</style>
    </div>
  );
}
