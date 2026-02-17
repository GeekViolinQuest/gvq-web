"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { apiFetch, clearToken } from "@/lib/api";

type SeasonItem = { codigo: string; data?: string | null };

type DashboardData = {
  ok: boolean;
  linked: boolean;
  user?: {
    email?: string;
    discordId?: string;
    displayName?: string;
  };
  progress?: {
    level: number;
    cristais: number;
    runas: string[];
    reliquias: string[];
    bonus: string[];
    season?: SeasonItem[];
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/user/me", { auth: true });
        setData(res);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <AuthGate>
      <div style={{ padding: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Sair
          </button>
        </div>

        {loading && <p>Carregando dados...</p>}

        {!loading && data && !data.linked && (
          <div style={{ marginTop: 20 }}>
            <p>⚠️ Seu Discord ainda não está vinculado.</p>
            <p>Vincule seu Discord para sincronizar conquistas.</p>
          </div>
        )}

        {!loading && data && data.linked && data.progress && (
          <div style={{ marginTop: 20 }}>
            <h2>
              {data.user?.displayName ||
                data.user?.email ||
                "Usuário"}
            </h2>

            <div style={{ marginTop: 20 }}>
              <p>
                <strong>Nível:</strong> {data.progress.level}
              </p>
              <p>
                <strong>Cristais Sonoros:</strong>{" "}
                {data.progress.cristais}
              </p>
              <p>
                <strong>Runas:</strong>{" "}
                {data.progress.runas.length}
              </p>
              <p>
                <strong>Relíquias:</strong>{" "}
                {data.progress.reliquias.length}
              </p>
              <p>
                <strong>Bônus:</strong>{" "}
                {data.progress.bonus.length}
              </p>
            </div>

            {/* Últimas conquistas */}
            <div style={{ marginTop: 30 }}>
              <h3>Últimas conquistas</h3>

              {/* Runas */}
              <div style={{ marginTop: 12 }}>
                <p>
                  <strong>Runas (últimas 5):</strong>
                </p>
                <ul>
                  {[...data.progress.runas]
                    .slice(-5)
                    .reverse()
                    .map((r, idx) => (
                      <li key={`${r}-${idx}`}>{r}</li>
                    ))}
                </ul>
              </div>

              {/* Relíquias */}
              <div style={{ marginTop: 12 }}>
                <p>
                  <strong>Relíquias (últimas 5):</strong>
                </p>
                <ul>
                  {[...data.progress.reliquias]
                    .slice(-5)
                    .reverse()
                    .map((r, idx) => (
                      <li key={`${r}-${idx}`}>{r}</li>
                    ))}
                </ul>
              </div>

              {/* Bônus */}
              <div style={{ marginTop: 12 }}>
                <p>
                  <strong>Bônus (últimos 5):</strong>
                </p>
                <ul>
                  {[...data.progress.bonus]
                    .slice(-5)
                    .reverse()
                    .map((b, idx) => (
                      <li key={`${b}-${idx}`}>{b}</li>
                    ))}
                </ul>
              </div>

              {/* Season */}
              {Array.isArray(data.progress.season) &&
                data.progress.season.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p>
                      <strong>Season (últimos 5 códigos):</strong>
                    </p>
                    <ul>
                      {[...data.progress.season]
                        .slice(-5)
                        .reverse()
                        .map((s, idx) => (
                          <li key={`${s.codigo}-${idx}`}>
                            {s.codigo}
                            {s.data ? ` — ${s.data}` : ""}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )}

        {!loading && !data && (
          <p>Não foi possível carregar os dados do dashboard.</p>
        )}
      </div>
    </AuthGate>
  );
}
