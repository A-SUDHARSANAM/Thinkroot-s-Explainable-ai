const API_BASE = import.meta.env.VITE_API_URL || "";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  let data = {};

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text().catch(() => "");
    if (text) {
      data = { error: text.slice(0, 250) };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }
  return data;
}

async function request(url, options) {
  try {
    const response = await fetch(url, options);
    return await parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to reach backend API. Ensure Flask is running and restart the frontend dev server.");
    }
    throw error;
  }
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);

  return request(`${API_BASE}/api/upload`, {
    method: "POST",
    body: form,
  });
}

export async function uploadDemo(name) {
  return request(`${API_BASE}/api/upload-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function listDemoFiles() {
  return request(`${API_BASE}/api/demo-files`);
}

export async function analyzeDocument(storedName, fileName) {
  return request(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stored_name: storedName, file_name: fileName }),
  });
}

export async function verifyDocument(storedName, fileName) {
  return request(`${API_BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stored_name: storedName, file_name: fileName }),
  });
}

export async function compareDocuments(storedNameA, storedNameB) {
  return request(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stored_name_a: storedNameA, stored_name_b: storedNameB }),
  });
}

export async function getHistory(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request(`${API_BASE}/api/history${query}`);
}

export async function clearHistory() {
  return request(`${API_BASE}/api/history`, { method: "DELETE" });
}

export function absoluteAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}
