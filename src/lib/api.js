// src/lib/api.js

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gvq_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gvq_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("gvq_token");
}

function getBase() {
  // remove barra final pra evitar //api/...
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

function joinUrl(base, path) {
  if (!base) return path; // fallback (útil em dev)
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}

/**
 * Padrão único de request:
 * - NÃO dá throw por padrão
 * - retorna { ok, status, data }
 * - se auth=true, injeta Authorization Bearer
 */
export async function apiRequest(
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

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      cache: "no-store",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // erro de rede (offline, DNS, CORS hard fail etc.)
    return { ok: false, status: 0, data: { error: "network_error" } };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Compat: apiFetch como você vinha usando nos componentes
 * Agora retorna { ok, status, data } (SEM throw)
 */
export function apiFetch(path, opts = {}) {
  return apiRequest(path, { auth: true, ...opts });
}

/**
 * Compat: apiGet retorna { ok, status, data } (SEM throw)
 */
export function apiGet(path, opts = {}) {
  return apiRequest(path, { method: "GET", auth: true, ...opts });
}

/**
 * Opcional: helper para limpar token e voltar pro login
 * (uso em telas/client)
 */
export function logoutAndRedirect(router) {
  clearToken();
  if (router) router.replace("/login");
}