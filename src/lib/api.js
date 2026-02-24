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
  // ✅ Se existir NEXT_PUBLIC_API_URL, o front chama o backend direto (útil no dev).
  // ✅ Se NÃO existir, o front chama o próprio site e o Next faz proxy via /api/_proxy.
  const b = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
  return b; // pode ser "" (modo proxy)
}

function rewritePathForProxy(path) {
  // quando base=="" (modo proxy), qualquer /api/... vira /api/_proxy/...
  if (path.startsWith("/api/_proxy/")) return path;
  if (path.startsWith("/api/")) return `/api/_proxy${path}`;
  if (path.startsWith("/")) return `/api/_proxy${path}`;
  return `/api/_proxy/${path}`;
}

function joinUrl(base, path) {
  if (path.startsWith("http")) return path;

  if (!path.startsWith("/")) path = `/${path}`;

  if (!base) {
    // modo proxy do Next
    return rewritePathForProxy(path);
  }

  // modo direto para o backend
  return `${base}${path}`;
}

/**
 * Padrão A (site inteiro):
 * - NUNCA lança throw
 * - SEMPRE retorna um objeto com ok/status
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