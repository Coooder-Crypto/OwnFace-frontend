const DEFAULT_BASE_URL = "http://localhost:4000";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? DEFAULT_BASE_URL;

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          typeof payload === "string"
            ? payload || response.statusText
            : payload?.error || response.statusText,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload as T,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected network error";
    return { ok: false, status: 0, error: message };
  }
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  return request<T>(path, { method: "GET" });
}

export function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}

export function putJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) });
}
