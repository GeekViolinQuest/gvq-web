"use client";

import { useEffect, useState } from "react";

export default function GVQShell({ title, subtitle, right, children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      // simples e confiável
      setIsMobile(window.innerWidth <= 900);
    }

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",

        backgroundImage: "url('/bg-taverna.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        // ✅ desktop fixed, mobile scroll
        backgroundAttachment: isMobile ? "scroll" : "fixed",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(900px 420px at 18% 10%, rgba(126,94,255,0.22), transparent 60%)," +
            "radial-gradient(900px 420px at 78% 30%, rgba(0,255,214,0.10), transparent 60%)," +
            "radial-gradient(800px 520px at 50% 90%, rgba(255,209,102,0.06), transparent 65%)," +
            "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.82) 100%)",
          backdropFilter: "blur(1px)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 18px" }}>
          {title || subtitle || right ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                {title ? <h1 style={{ fontSize: 34, marginBottom: 6 }}>{title}</h1> : null}
                {subtitle ? <div style={{ opacity: 0.85 }}>{subtitle}</div> : null}
              </div>
              {right ? <div>{right}</div> : null}
            </div>
          ) : null}

          <div style={{ marginTop: title || subtitle || right ? 18 : 0 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}