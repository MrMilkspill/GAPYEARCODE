import { ApiError } from "@/lib/api/client";

type RegisterAccountPayload = {
  email: string;
  fullName: string;
  password: string;
};

type RegisterAccountResponse = {
  user: {
    email: string | null;
    id: string | null;
  };
};

export function registerAccount(payload: RegisterAccountPayload) {
  return accountRegistrationRequest<RegisterAccountResponse>({
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      full_name: payload.fullName,
      password: payload.password,
    }),
  });
}


async function accountRegistrationRequest<T>(
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch("/api/auth/register", {
      ...init,
      cache: init.cache ?? "no-store",
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach the account registration endpoint.";

    throw new ApiError(message, 0);
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
      "Unable to create account.";

    throw new ApiError(message, response.status);
  }

  return (json ?? undefined) as T;
}
