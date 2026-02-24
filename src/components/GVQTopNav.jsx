"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

function isActivePath(pathname, href) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Pill({ children, title }) {
  return (
    <span
      title={title}
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        opacity: 0.95,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function NavItem({ href, icon, label, onClick }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "white",
        fontSize: 14,
        fontWeight: active ? 900 : 700,
        letterSpacing: 0.2,
      }}
    >
      <span style={{ opacity: 0.95 }}>{icon}</span>
      <span className="gvqNavLabel">{label}</span>
    </Link>
  );
}

export default function GVQTopNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [me, setMe] = useState(null); // {displayName,email,role, cristaisSonoros, nivel}
  const [meErr, setMeErr] = useState("");

  const items = useMemo(
    () => [
      { href: "/dashboard", icon: "🏠", label: "Dashboard" },
      { href: "/perfil", icon: "👤", label: "Perfil" },
      { href: "/season", icon: "⚔️", label: "Season" },
      { href: "/resgatar", icon: "🔓", label: "Resgatar" },
      { href: "/leaderboard", icon: "🏆", label: "Ranking" },
      { href: "/forum", icon: "💬", label: "Comunidade" },
    ],
    []
  );

  const isGM = me?.role === "gm" || me?.role === "admin";

  async function loadMe(signal) {
    try {
      setMeErr("");
      const r = await apiGet("/api/me", { signal, auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar perfil");
      setMe(r.me || null);
    } catch (e) {
      if (e?.name === "AbortError") return;
      // Não derruba a UI — só não mostra HUD
      setMe(null);
      setMeErr(e?.message || "Erro");
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadMe(ac.signal);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function logout() {
    try {
      localStorage.removeItem("gvq_token");
    } catch {}
    router.push("/login");
  }

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(4,6,12,0.72)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, rgba(126,94,255,0.0), rgba(126,94,255,0.55), rgba(0,255,214,0.35), rgba(255,209,102,0.25), rgba(126,94,255,0.0))",
            opacity: 0.85,
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Marca / Hub */}
          <Link
            href="/dashboard"
            style={{
              textDecoration: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ fontSize: 18 }}>🎻</span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 1000, letterSpacing: 0.4 }}>Geek Violin Quest</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Hub do Guardião</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="gvqNavDesktop" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {items.map((it) => (
              <NavItem key={it.href} href={it.href} icon={it.icon} label={it.label} />
            ))}
            {isGM ? <NavItem href="/admin/dashboard" icon="🛡️" label="Admin" /> : null}
          </div>

          {/* HUD + ações */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {me?.displayName ? <Pill title="Seu nome">{me.displayName}</Pill> : null}

            {typeof me?.cristaisSonoros === "number" ? (
              <Pill title="Cristais Sonoros (Season)">
                💎 {me.cristaisSonoros}
              </Pill>
            ) : null}

            <button
              onClick={logout}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,80,80,0.16)",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
              }}
              title="Sair da conta"
            >
              Sair
            </button>

            {/* Mobile burger */}
            <button
              className="gvqNavBurger"
              onClick={() => setOpen((v) => !v)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
                display: "none",
              }}
              aria-label="Abrir menu"
            >
              {open ? "✖" : "☰"}
            </button>
          </div>
        </div>

        {open ? (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 18px 14px 18px" }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 10,
                background: "rgba(255,255,255,0.03)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {items.map((it) => (
                <NavItem key={it.href} href={it.href} icon={it.icon} label={it.label} onClick={() => setOpen(false)} />
              ))}
              {isGM ? <NavItem href="/admin/dashboard" icon="🛡️" label="Admin" onClick={() => setOpen(false)} /> : null}
            </div>

            {meErr ? (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                (HUD indisponível: {meErr})
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @media (max-width: 860px) {
          .gvqNavDesktop {
            display: none !important;
          }
          .gvqNavBurger {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}