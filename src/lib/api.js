// src/lib/api.js

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gvq_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (!token) return;
  localStorage.setItem("gvq_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("gvq_token");
}

/**
 * Padrão:
 * - Frontend chama SEMPRE rotas internas do Next: /api/...
 * - Essas rotas internas falam com o backend via process.env.API_URL no servidor.
 * - NUNCA usa NEXT_PUBLIC_API_URL no browser (evita CORS e inconsistência).
 */
export async function apiFetch(
  path,
  { method = "GET", body, auth = false, headers: extraHeaders } = {}
) {
  let url = path;
  if (!url.startsWith("/")) url = `/${url}`;

  const headers = new Headers(extraHeaders || {});

  // Só seta JSON se tiver body
  if (body !== undefined) headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (auth && res.status === 401) clearToken();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        ...(data && typeof data === "object" ? data : {}),
        error: data?.error || `Erro HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      ...(data && typeof data === "object" ? data : { data }),
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e?.message || "Falha de rede",
    };
  }
}

export function apiGet(path, { auth = true } = {}) {
  return apiFetch(path, { method: "GET", auth });
}

export function apiPost(path, body, { auth = true } = {}) {
  return apiFetch(path, { method: "POST", auth, body });
}