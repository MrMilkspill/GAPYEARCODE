import { NextResponse } from "next/server";


function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!baseUrl) {
    return null;
  }

  return baseUrl.replace(/\/+$/, "");
}


function getBackendUnavailableMessage(baseUrl: string) {
  return (
    `Backend API is unreachable at ${baseUrl}. ` +
    "Check NEXT_PUBLIC_BACKEND_API_URL and confirm the deployment is healthy."
  );
}


export async function POST(request: Request) {
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
