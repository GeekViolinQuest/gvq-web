"use client";

import { useEffect, useState } from "react";

export default function LoadingDots({ label = "Carregando" }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setN((x) => (x + 1) % 4), 350);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ opacity: 0.85, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontWeight: 800 }}>{label}</span>
      <span style={{ letterSpacing: 2 }}>{Array(n).fill("•").join("")}</span>
    </div>
  );
}