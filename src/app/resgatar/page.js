"use client";

import React, { useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";

export default function ResgatarPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const cleaned = code.trim();
    if (!cleaned) {
      setLoading(false);
      setError("Digite um código.");
      return;
    }

    try {
      const res = await apiFetch("/api/redeem", {
        method: "POST",
        auth: true,
        body: { code: cleaned },
      });

      setMessage(
        res?.type === "runa"
          ? "✨ Runa resgatada com sucesso!"
          : "🏆 Relíquia conquistada!"
      );
      setCode("");
    } catch (err) {
      setError(err?.message || "Erro ao resgatar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ padding: 40, maxWidth: 500 }}>
        <h1>Resgatar Código</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite seu código..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              marginTop: 20,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              padding: 10,
              width: "100%",
              cursor: "pointer",
            }}
          >
            {loading ? "Resgatando..." : "Resgatar"}
          </button>
        </form>

        {message && <p style={{ marginTop: 20, color: "green" }}>{message}</p>}
        {error && <p style={{ marginTop: 20, color: "red" }}>{error}</p>}
      </div>
    </AuthGate>
  );
}
