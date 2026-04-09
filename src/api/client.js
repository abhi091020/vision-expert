const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Derive WebSocket URL from BASE_URL (http → ws, https → wss)
const WS_URL = BASE_URL.replace(/^http/, "ws");

export { BASE_URL, WS_URL };

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BASE_URL}/`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPostForm(endpoint, formData) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  return res.json();
}

// Mode is a path param, no body required
export async function setMode(mode) {
  const res = await fetch(`${BASE_URL}/set_mode/${mode}`, {
    method: "POST",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`setMode(${mode}) failed: ${res.status}`);
  return res.json();
}
