export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions {
  baseUrl: string;
  getAuthToken?: () => string | undefined | null;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

export type RequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: TBody;
  // When false, do not send Content-Type for FormData
  sendJson?: boolean;
};

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: ApiClientOptions["getAuthToken"];
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getAuthToken = options.getAuthToken;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.timeoutMs = options.timeoutMs ?? 20000;
  }

  async request<TResponse = unknown, TBody = unknown>(
    path: string,
    opts: RequestOptions<TBody> = {}
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const url = `${this.baseUrl}${path}${buildQuery(opts.query)}`;
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...(opts.headers ?? {}),
      };

      const token = this.getAuthToken?.();
      // Only add Authorization header if token is a valid non-empty string
      if (
        token &&
        typeof token === "string" &&
        token.trim() !== "" &&
        token !== "undefined" &&
        token !== "null"
      ) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let body: BodyInit | undefined = undefined;
      const sendJson = opts.sendJson !== false;
      if (opts.body instanceof FormData) {
        body = opts.body as unknown as BodyInit;
      } else if (opts.body !== undefined && opts.body !== null) {
        if (sendJson) {
          headers["Content-Type"] =
            headers["Content-Type"] ?? "application/json";
          body = JSON.stringify(opts.body);
        }
      }

      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers,
        body,
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson
        ? await res.json().catch(() => undefined)
        : await res.text().catch(() => undefined);

      if (!res.ok) {
        const message =
          (isJson && payload?.message) || res.statusText || "Request failed";
        const code = isJson ? payload?.code : undefined;
        throw new ApiError({
          status: res.status,
          message,
          code,
          details: payload,
        });
      }

      return (payload as TResponse) ?? (undefined as unknown as TResponse);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiError({ status: 0, message: "Request timed out" });
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError({
        status: 0,
        message: (err as Error).message || "Network error",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T = unknown>(
    path: string,
    opts: Omit<RequestOptions, "method" | "body"> = {}
  ) {
    return this.request<T>(path, { ...opts, method: "GET" });
  }
  post<T = unknown, B = unknown>(
    path: string,
    body?: B,
    opts: Omit<RequestOptions<B>, "method"> = {}
  ) {
    return this.request<T, B>(path, { ...opts, method: "POST", body });
  }
  put<T = unknown, B = unknown>(
    path: string,
    body?: B,
    opts: Omit<RequestOptions<B>, "method"> = {}
  ) {
    return this.request<T, B>(path, { ...opts, method: "PUT", body });
  }
  patch<T = unknown, B = unknown>(
    path: string,
    body?: B,
    opts: Omit<RequestOptions<B>, "method"> = {}
  ) {
    return this.request<T, B>(path, { ...opts, method: "PATCH", body });
  }
  delete<T = unknown, B = unknown>(
    path: string,
    body?: B,
    opts: Omit<RequestOptions<B>, "method"> = {}
  ) {
    return this.request<T, B>(path, { ...opts, method: "DELETE", body });
  }
}

export const api = new ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  getAuthToken: () => {
    const token = localStorage.getItem("auth_token");
    // Return token only if it's a valid non-empty string
    return token &&
      token !== "undefined" &&
      token !== "null" &&
      token.trim() !== ""
      ? token
      : undefined;
  },
  defaultHeaders: { Accept: "application/json" },
});
