"use client";

import AuthGate from "@/components/AuthGate";
import GMGate from "@/components/GMGate";
import Link from "next/link";

function Card({ title, desc, href }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "white" }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontWeight: 1000, fontSize: 16 }}>{title}</div>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>{desc}</div>
      </div>
    </Link>
  );
}

export default function AdminHome() {
  return (
    <AuthGate>
      <GMGate>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
          <h1 style={{ fontSize: 34, marginBottom: 6 }}>Painel do Guardião Mestre</h1>
          <div style={{ opacity: 0.8, marginBottom: 18 }}>Administração do GVQ (GM only).</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <Card
              title="🗓️ Temporadas"
              desc="Criar/ativar/desativar temporadas + reset do Primeiro Estelar"
              href="/admin/season"
            />
            <Card
              title="⚔️ Eventos Épicos"
              desc="CRUD mínimo de EpicEvent (criar/ativar/desativar)"
              href="/admin/epic"
            />
            <Card
              title="💎 Ferramentas (Cristais)"
              desc="Dar/remover/setar cristais + reset global da Season"
              href="/admin/tools"
            />
            <Card
              title="👥 Alunos"
              desc="Ver lista + busca + progresso (cristais/nível/runas/reliquias)"
              href="/admin/alunos"
            />
            <Card
              title="📣 Avisos"
              desc="Criar avisos que aparecem no dashboard"
              href="/admin/announcements"
            />
          </div>
        </div>
      </GMGate>
    </AuthGate>
  );
}