import { API_CONFIG } from "@/lib/constants";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_CONFIG.baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, headers = {}, signal } = options;

  const url = buildUrl(path, params);

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Auth header will be added here once auth is implemented
      // "Authorization": `Bearer ${getAuthToken()}`,
      ...headers,
    },
    signal,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>, signal?: AbortSignal) =>
    request<T>(path, { params, signal }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
};

export { ApiError };
