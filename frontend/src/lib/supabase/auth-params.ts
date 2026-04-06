import { siteConfig } from "@/lib/site";


const AUTH_PARAM_KEYS = [
  "access_token",
  "code",
  "error",
  "error_code",
  "error_description",
  "refresh_token",
  "token_hash",
  "type",
];

const DEFAULT_NEXT_PATH = "/dashboard";

function getHashParams(hash: string) {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(normalizedHash);
}

export function hasSupabaseAuthParams(href: string) {
  const url = new URL(href);
  const hashParams = getHashParams(url.hash);

  for (const key of AUTH_PARAM_KEYS) {
    if (url.searchParams.has(key) || hashParams.has(key)) {
      return true;
    }
  }

  return false;
}

export function getSupabaseAuthRedirectHref(href: string) {
  const url = new URL(href);
  return `/auth/confirm${url.search}${url.hash}`;
}

export function normalizeAuthNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return next;
}

export function getSupabaseEmailRedirectOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallbackSiteUrl = configuredSiteUrl || siteConfig.url;
  return new URL(fallbackSiteUrl).origin;
}

export function buildSupabaseEmailRedirectUrl(
  next: string | null | undefined,
) {
  const url = new URL("/auth/confirm", getSupabaseEmailRedirectOrigin());
  url.searchParams.set("next", normalizeAuthNextPath(next));
  return url.toString();
}

export function readSupabaseAuthState(href: string) {
  const url = new URL(href);
  const hashParams = getHashParams(url.hash);
  const params = new URLSearchParams(url.search);

  hashParams.forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  return {
    accessToken: params.get("access_token"),
    code: params.get("code"),
    error: params.get("error"),
    errorCode: params.get("error_code"),
    errorDescription: params.get("error_description"),
    next: normalizeAuthNextPath(params.get("next")),
    refreshToken: params.get("refresh_token"),
    tokenHash: params.get("token_hash"),
    type: params.get("type"),
  };
}
