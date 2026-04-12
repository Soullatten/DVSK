import React from 'react';

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "50px clamp(20px, 4vw, 56px)", textAlign: "center", marginTop: "100px", backgroundColor: "transparent", position: "relative", zIndex: 10 }}>
      {/* Brand Sub-logo or divider could go here */}
      <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: "30px", color: "#fff" }}>
        DVSK
      </h3>
      
      <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginBottom: "40px" }}>
        <a href="#" style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textDecoration: "none", textTransform: "uppercase", transition: "color 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>Terms</a>
        <a href="#" style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textDecoration: "none", textTransform: "uppercase", transition: "color 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>Privacy</a>
        <a href="#" style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textDecoration: "none", textTransform: "uppercase", transition: "color 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>Contact</a>
      </div>

      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", textTransform: "uppercase" }}>
        © 2026 DVSK CLO. SYNDICATE. ALL RIGHTS RESERVED.
      </p>
    </footer>
  );
}
