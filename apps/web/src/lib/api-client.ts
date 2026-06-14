const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch(path: string, init: RequestInit = {}, allowRefresh = true): Promise<Response> {
  const token = window.localStorage.getItem("axonote_token");
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && allowRefresh) {
    const refreshToken = window.localStorage.getItem("axonote_refresh_token");
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        window.localStorage.setItem("axonote_token", data.access_token);
        window.localStorage.setItem("axonote_refresh_token", data.refresh_token);
        return apiFetch(path, init, false);
      }
    }
    window.localStorage.removeItem("axonote_token");
    window.localStorage.removeItem("axonote_refresh_token");
    window.location.href = "/";
  }

  return response;
}

export function storeAuthSession(accessToken: string, refreshToken?: string | null) {
  window.localStorage.setItem("axonote_token", accessToken);
  if (refreshToken) {
    window.localStorage.setItem("axonote_refresh_token", refreshToken);
  }
}

export async function logoutSession() {
  const refreshToken = window.localStorage.getItem("axonote_refresh_token");
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Best-effort server logout.
    }
  }
  window.localStorage.removeItem("axonote_token");
  window.localStorage.removeItem("axonote_refresh_token");
}

export { API_BASE_URL };
