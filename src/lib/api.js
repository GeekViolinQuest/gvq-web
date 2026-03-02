// src/lib/api.js

// =====================
// Token helpers
// =====================
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

// =====================
// Client-side caches
// =====================
// Cache em memória do módulo (reseta ao recarregar a página)
let _meCache = null;
let _meCacheAt = 0;

export function clearMeCache() {
  _meCache = null;
  _meCacheAt = 0;
}

// =====================
// Fetch helpers
// =====================

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
  // Guard rail: não deixa passar URL absoluta no client sem querer
  if (typeof path === "string" && /^https?:\/\//i.test(path)) {
    throw new Error("Não use URL absoluta no client. Use sempre rotas internas /api/...");
  }

  let url = path;
  if (!url.startsWith("/")) url = `/${url}`;

  const headers = new Headers(extraHeaders || {});

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

    const parsed = await res.json().catch(() => ({}));

    // ✅ sempre expõe payload em `data` (pra quem usa r.data)
    // ✅ e também espalha o payload (pra quem usa r.user/r.progress etc)
    const payload = parsed && typeof parsed === "object" ? parsed : { value: parsed };

    // ⚠️ Importante: NÃO limpar token em 5xx/0 (instabilidade).
    // Só em 401/403 (token inválido/sem permissão).
    if (auth && (res.status === 401 || res.status === 403)) {
      clearMeCache();
      clearToken();
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: payload,
        ...payload,
        error: payload?.error || `Erro HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: payload,
      ...payload,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
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

// =====================
// Cached endpoints
// =====================

/**
 * apiMe: cacheia /api/user/me em memória por um tempo curto
 * - Evita revalidar token a cada troca de página
 * - Deixa navegação muito mais rápida em infra com cold start/latência
 *
 * Uso:
 *   const r = await apiMe(); // cache 60s
 *   const r = await apiMe({ maxAgeMs: 10_000 }); // cache 10s
 */
export async function apiMe({ maxAgeMs = 60_000 } = {}) {
  const now = Date.now();

  if (_meCache && now - _meCacheAt < maxAgeMs) {
    return _meCache;
  }

  const r = await apiGet("/api/user/me", { auth: true });

  // Só cacheia se ok
  if (r?.ok) {
    _meCache = r;
    _meCacheAt = now;
    return r;
  }

  // Se for 401/403, limpa cache+token (apiFetch já faz isso, mas garantimos aqui)
  if (r?.status === 401 || r?.status === 403) {
    clearMeCache();
    clearToken();
  }

  return r;
}