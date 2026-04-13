import React from 'react';

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "50px clamp(20px, 4vw, 56px)", textAlign: "center", marginTop: "100px", backgroundColor: "transparent", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: "600px", margin: "0 auto 60px", padding: "40px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", textTransform: "uppercase", marginBottom: "15px", color: "#fff" }}>Request Access</h4>
        <p style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: "30px", textTransform: "uppercase", lineHeight: 1.6 }}>Join the Syndicate. Secure early access to archives, core drops, and private installations.</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="email" placeholder="ENTER COMMS LINK" style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "15px 20px", color: "#fff", fontSize: "12px", letterSpacing: "0.1em", outline: "none", fontFamily: "'Jost', sans-serif" }} />
          <button style={{ background: "#fff", color: "#000", border: "none", padding: "0 30px", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", transition: "background 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#8B2BE2"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>Join</button>
        </div>
      </div>

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
