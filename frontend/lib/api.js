// Same-origin mode for the Vercel services deploy (backend routed at /api/*).
const RAW = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const API_URL = RAW === "same-origin" ? "/api/v1" : RAW;

export function getTokens() {
  if (typeof window === "undefined") return {};
  return {
    access: localStorage.getItem("access") || "",
    refresh: localStorage.getItem("refresh") || "",
  };
}

export function saveTokens({ access, refresh }) {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {};
  const { access } = getTokens();
  if (auth && access) headers.Authorization = `Bearer ${access}`;
  let payload;
  if (isForm) {
    payload = body;
  } else {
    headers["Content-Type"] = "application/json";
    payload = body ? JSON.stringify(body) : undefined;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  if (res.status === 401 && auth) {
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || JSON.stringify(data))) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiDownload(path, filename) {
  const { access } = getTokens();
  const res = await fetch(`${API_URL}${path}`, {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function fieldErrors(err) {
  const out = {};
  if (err && err.data && typeof err.data === "object") {
    for (const [k, v] of Object.entries(err.data)) {
      out[k] = Array.isArray(v) ? v.join(" ") : String(v);
    }
  }
  return out;
}
