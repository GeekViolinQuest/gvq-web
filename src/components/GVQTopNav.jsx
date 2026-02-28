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

function Pill({ children, title, onClick, clickable }) {
  return (
    <span
      title={title}
      onClick={onClick}
      style={{
        fontSize: 16,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        opacity: 0.95,
        whiteSpace: "nowrap",
        cursor: clickable ? "pointer" : "default",
        userSelect: "none",
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
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  // HUD model (simplificado pro HUB)
  const [me, setMe] = useState(null); // { displayName, email, role, cristaisSonoros, nivel }
  const [meErr, setMeErr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo(
    () => [
      { href: "/dashboard", icon: "🏠", label: "Dashboard" },
      { href: "/perfil", icon: "👤", label: "Perfil" },
      { href: "/season", icon: "⚔️", label: "Season Quests" },
      { href: "/season-feed", icon: "🖼️", label: "Galeria da Season" }, // ✅ NOVO
      { href: "/resgatar", icon: "🔓", label: "Resgatar Código" },
      { href: "/leaderboard", icon: "🏆", label: "Ranking" },
      { href: "/forum", icon: "💬", label: "Comunidade" },
    ],
    []
  );

  const isGM = me?.role === "gm" || me?.role === "admin";

  function mapUserMeToHud(payload) {
    // payload esperado do /api/user/me:
    // { ok, user: {...}, progress: {...} }
    const u = payload?.user || {};
    const p = payload?.progress || {};

    return {
      displayName: u.displayName || "",
      email: u.email || "",
      role: u.role || "aluno",
      cristaisSonoros: typeof p.cristais === "number" ? p.cristais : 0,
      nivel: typeof p.level === "number" ? p.level : 0,
    };
  }

  async function loadMe() {
    try {
      setMeErr("");
      const r = await apiGet("/api/user/me", { auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar perfil");

      // com o patch do api.js, r.data existe e também vem espalhado
      const payload = r.data || r;
      setMe(mapUserMeToHud(payload));
    } catch (e) {
      setMe(null);
      setMeErr(e?.message || "Erro");
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadMe();
    setRefreshing(false);
  }

  // 1) carrega ao montar
  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) recarrega ao trocar de página (mantém HUD sempre “vivo”)
  useEffect(() => {
    // evita spam de requests em navegação muito rápida
    const t = setTimeout(() => {
      loadMe();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
            <span style={{ fontSize: 24 }}>🎻</span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: 1.0 }}>Geek Violin Quest</div>          
              <div style={{ fontSize: 16, opacity: 0.75 }}>Hub do Guardião</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="gvqNavDesktop" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {items.map((it) => (
              <NavItem key={it.href} href={it.href} icon={it.icon} label={it.label} />
            ))}
            {isGM ? <NavItem href="/admin" icon="🛡️" label="Admin" /> : null}
          </div>

          {/* HUD + ações */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {me?.displayName ? <Pill title="Seu nome">{me.displayName}</Pill> : null}

            {typeof me?.cristaisSonoros === "number" ? (
              <Pill
                title="Cristais Sonoros (clique para atualizar)"
                clickable
                onClick={refresh}
              >
                💎 {me.cristaisSonoros} {refreshing ? "…" : ""}
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
                <NavItem
                  key={it.href}
                  href={it.href}
                  icon={it.icon}
                  label={it.label}
                  onClick={() => setOpen(false)}
                />
              ))}
              {isGM ? (
                <NavItem href="/admin/dashboard" icon="🛡️" label="Admin" onClick={() => setOpen(false)} />
              ) : null}
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