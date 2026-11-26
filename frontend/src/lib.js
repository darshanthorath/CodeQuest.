import { today } from "./date.js";

export { today };
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Every request carries the browser's local date (?date=YYYY-MM-DD) so the server
// computes streaks, missions and the heatmap in the user's own timezone.
const withDate = (path) => `${path}${path.includes("?") ? "&" : "?"}date=${today()}`;

export async function request(path, token, options = {}) {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API}${withDate(path)}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({
    message: "Unexpected server response"
  }));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// Download a protected file (needs the Authorization header, so a plain <a href> will not work)
export async function requestBlob(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not open the file");
  }
  return response.blob();
}
