import { NextResponse } from "next/server";


const DUPLICATE_ACCOUNT_MESSAGE = "An account with this email already exists.";


function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!baseUrl) {
    return null;
  }

  return baseUrl.replace(/\/+$/, "");
}


function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}


function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}


function getBackendUnavailableMessage(baseUrl: string) {
  return (
    `Backend API is unreachable at ${baseUrl}. ` +
    "Check NEXT_PUBLIC_BACKEND_API_URL and confirm the deployment is healthy."
  );
}


function extractErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    for (const key of ["msg", "message", "error_description", "error"]) {
      const value = (payload as Record<string, unknown>)[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return "Unable to create account.";
}


function isDuplicateAccountError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("already") ||
    normalizedMessage.includes("registered")
  );
}


async function createSupabaseAccount(request: Request) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { detail: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const account = payload as Record<string, unknown>;
  const email = typeof account.email === "string" ? account.email.trim() : "";
  const password =
    typeof account.password === "string" ? account.password.trim() : "";
  const fullName =
    typeof account.full_name === "string" ? account.full_name.trim() : "";

  let response: Response;

  try {
    response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/admin/users`, {
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach Supabase Auth while creating account. Try again in a moment." },
      { status: 502 },
    );
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const data =
    contentType.includes("application/json") && text.trim()
      ? (JSON.parse(text) as unknown)
      : null;

  if (!response.ok) {
    let detail = extractErrorMessage(data);
    let status = response.status >= 500 ? 502 : 400;

    if (isDuplicateAccountError(detail)) {
      detail = DUPLICATE_ACCOUNT_MESSAGE;
      status = 409;
    }

    return NextResponse.json({ detail }, { status });
  }

  const user =
    data && typeof data === "object" && "user" in data
      ? (data as { user: unknown }).user
      : data;

  if (!user || typeof user !== "object") {
    return NextResponse.json(
      { detail: "Supabase returned an invalid registration response." },
      { status: 502 },
    );
  }

  const userRecord = user as Record<string, unknown>;

  return NextResponse.json(
    {
      user: {
        id: typeof userRecord.id === "string" ? userRecord.id : null,
        email: typeof userRecord.email === "string" ? userRecord.email : null,
      },
    },
    { status: 201 },
  );
}


async function createBackendAccount(request: Request) {
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    return NextResponse.json(
      { detail: "Backend API is not configured. Set NEXT_PUBLIC_BACKEND_API_URL." },
      { status: 500 },
    );
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/auth/register`, {
      body: await request.text(),
      cache: "no-store",
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
      },
      method: "POST",
    });
  } catch {
    return NextResponse.json(
      { detail: getBackendUnavailableMessage(baseUrl) },
      { status: 502 },
    );
  }

  const contentType = response.headers.get("content-type") ?? "application/json";
  const body = await response.text();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
    },
    status: response.status,
  });
}


export async function POST(request: Request) {
  const supabaseResponse = await createSupabaseAccount(request.clone());

  return supabaseResponse ?? createBackendAccount(request);
}
