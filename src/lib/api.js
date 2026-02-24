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

function getBase() {
  // se NEXT_PUBLIC_API_URL existir, usa (útil no dev).
  // se não existir, usa "" e chama o /api do próprio site.
  const b = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  return b;
}

function joinUrl(base, path) {
  if (!base) return path;
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}

/**
 * Padrão A (site inteiro):
 * - NUNCA lança throw
 * - SEMPRE retorna um objeto com ok/status
 *
 * ✅ Agora: quando o backend devolve JSON, a gente "desembrulha":
 *   - ok=true  => { ok:true, status, ...data }
 *   - ok=false => { ok:false, status, error, ...data }
 */
export async function apiFetch(
  path,
  { method = "GET", body, auth = false, headers: extraHeaders } = {}
) {
  const headers = new Headers(extraHeaders || {});
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = joinUrl(getBase(), path);

  try {
    const res = await fetch(url, {
      method,
      headers,
      cache: "no-store",
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    // ✅ se token expirou / inválido, limpa pra evitar “travamento”
    if (auth && res.status === 401) {
      clearToken();
    }

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

// helpers práticos
export function apiGet(path, { auth = true } = {}) {
  return apiFetch(path, { method: "GET", auth });
}

export function apiPost(path, body, { auth = true } = {}) {
  return apiFetch(path, { method: "POST", auth, body });
}