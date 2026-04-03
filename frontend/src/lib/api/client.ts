import { getSupabaseClient } from "@/lib/supabase/client";


export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}


function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Backend API is not configured. Set NEXT_PUBLIC_BACKEND_API_URL.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
}


export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const json =
    contentType.includes("application/json") && text.trim()
      ? (JSON.parse(text) as Record<string, unknown>)
      : null;

  if (!response.ok) {
    const message =
      (typeof json?.detail === "string" && json.detail) ||
      (typeof json?.error === "string" && json.error) ||
      response.statusText ||
      "Request failed.";

    throw new ApiError(message, response.status);
  }

  return (json ?? undefined) as T;
}
