import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ClientServices() {
  const [inquiryType, setInquiryType] = useState('general');
  const navigate = useNavigate();

  return (
    <div className="dvsk-page-services" style={{ background: '#020202', minHeight: '100vh', color: '#fff', paddingTop: '150px', paddingBottom: '100px', paddingLeft: 'clamp(20px, 5vw, 100px)', paddingRight: 'clamp(20px, 5vw, 100px)', fontFamily: "'Jost', sans-serif", position: 'relative' }}>
      
      {/* Return Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ position: 'absolute', top: '40px', left: 'clamp(20px, 5vw, 100px)', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'color 0.3s', zIndex: 100 }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      >
        <ArrowLeft size={16} /> Return to Grid
      </button>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '10vw' }}>
        
        {/* Left Column (Info) */}
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(3rem, 5vw, 5rem)', textTransform: 'uppercase', lineHeight: 1, marginBottom: '40px' }}>Client<br/>Services</h1>
          <p style={{ fontSize: '14px', opacity: 0.6, letterSpacing: '0.05em', lineHeight: 1.8, marginBottom: '50px' }}>
            For general inquiries, bespoke styling, or archival restorations, connect with the Syndicate grid. Response vectors established within 48 planetary hours.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8 }}>
            <div>
              <span style={{ color: '#8B2BE2', display: 'block', marginBottom: '10px' }}>// GLOBAL HQ</span>
              TOKYO, JP — 35.6895° N, 139.6917° E
            </div>
            <div>
              <span style={{ color: '#8B2BE2', display: 'block', marginBottom: '10px' }}>// DIRECT COMMS</span>
              syndicate@dvsk.clothing
            </div>
          </div>
        </div>

        {/* Right Column (Terminal Form) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(30px, 5vw, 60px)' }}>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Inquiry Select */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {['general', 'styling', 'repairs'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setInquiryType(type)}
                  style={{ background: inquiryType === type ? '#8B2BE2' : 'transparent', color: inquiryType === type ? '#fff' : 'rgba(255,255,255,0.5)', border: `1px solid ${inquiryType === type ? '#8B2BE2' : 'rgba(255,255,255,0.1)'}`, padding: '10px 20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>IDENTIFICATION</label>
              <input type="text" placeholder="FULL NAME" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '15px 0', color: '#fff', fontSize: '16px', outline: 'none', fontFamily: "'Jost', sans-serif" }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>COMMS LINK</label>
              <input type="email" placeholder="EMAIL ADDRESS" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '15px 0', color: '#fff', fontSize: '16px', outline: 'none', fontFamily: "'Jost', sans-serif" }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>TRANSMISSION DATA</label>
              <textarea placeholder="ENTER DETAILS..." rows={4} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '15px 0', color: '#fff', fontSize: '16px', outline: 'none', fontFamily: "'Jost', sans-serif", resize: 'vertical' }} />
            </div>

            <button type="submit" style={{ marginTop: '20px', background: '#fff', color: '#000', border: 'none', padding: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#8B2BE2'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
              TRANSMIT
            </button>
          </form>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dvsk-page-services { padding-top: 110px !important; padding-bottom: 60px !important; }
          .dvsk-page-services > div:nth-child(2) {
            grid-template-columns: 1fr !important;
            gap: 56px !important;
          }
          .dvsk-page-services h1 { font-size: clamp(2.4rem, 11vw, 4rem) !important; }
          .dvsk-page-services input, .dvsk-page-services textarea { font-size: 14px !important; padding: 12px 0 !important; }
          .dvsk-page-services form > div:first-child button { font-size: 9px !important; padding: 8px 14px !important; }
        }
        @media (max-width: 480px) {
          .dvsk-page-services { padding-left: 18px !important; padding-right: 18px !important; }
        }
      `}</style>
    </div>
  );
}
