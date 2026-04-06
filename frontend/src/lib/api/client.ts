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


function isLocalBackendUrl(baseUrl: string) {
  return /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);
}


function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Backend API is not configured. Set NEXT_PUBLIC_BACKEND_API_URL.",
    );
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    isLocalBackendUrl(normalizedBaseUrl)
  ) {
    throw new Error(
      "Backend API points to localhost in production. Set NEXT_PUBLIC_BACKEND_API_URL to your deployed backend URL.",
    );
  }

  return normalizedBaseUrl;
}


function getBackendUnavailableMessage(baseUrl: string) {
  if (isLocalBackendUrl(baseUrl)) {
    return (
      `Backend API is unreachable at ${baseUrl}. ` +
      "Start the backend server or set NEXT_PUBLIC_BACKEND_API_URL to your deployed backend URL."
    );
  }

  return (
    `Backend API is unreachable at ${baseUrl}. ` +
    "Check NEXT_PUBLIC_BACKEND_API_URL and confirm the deployment is healthy."
  );
}


export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getBackendBaseUrl();
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

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: init.cache ?? "no-store",
      headers,
    });
  } catch (error) {
    const message =
      error instanceof TypeError
        ? getBackendUnavailableMessage(baseUrl)
        : error instanceof Error
          ? error.message
          : "Unable to reach the backend API.";

    throw new ApiError(message, 0);
  }

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
