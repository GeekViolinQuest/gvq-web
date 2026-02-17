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

// Para chamadas internas (Next proxy) -> /api/...
export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erro HTTP ${res.status}`);
  return data;
}
