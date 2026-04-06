import {
  buildSupabaseEmailRedirectUrl,
  getSupabaseEmailRedirectOrigin,
  getSupabaseAuthRedirectHref,
  hasSupabaseAuthParams,
  normalizeAuthNextPath,
  readSupabaseAuthState,
} from "@/lib/supabase/auth-params";


describe("supabase auth param helpers", () => {
  it("detects auth params in the query string", () => {
    expect(
      hasSupabaseAuthParams(
        "http://localhost:3000/?error=access_denied&error_code=otp_expired",
      ),
    ).toBe(true);
  });

  it("detects auth params in the hash fragment", () => {
    expect(
      hasSupabaseAuthParams(
        "http://localhost:3000/#access_token=test-token&refresh_token=test-refresh",
      ),
    ).toBe(true);
  });

  it("preserves the original query string and hash when redirecting", () => {
    expect(
      getSupabaseAuthRedirectHref(
        "http://localhost:3000/?next=%2Fdashboard#error=access_denied",
      ),
    ).toBe("/auth/confirm?next=%2Fdashboard#error=access_denied");
  });

  it("merges search params and hash params into one auth state", () => {
    expect(
      readSupabaseAuthState(
        "http://localhost:3000/?next=%2Fdashboard#error=access_denied&error_code=otp_expired",
      ),
    ).toEqual({
      accessToken: null,
      code: null,
      error: "access_denied",
      errorCode: "otp_expired",
      errorDescription: null,
      next: "/dashboard",
      refreshToken: null,
      tokenHash: null,
      type: null,
    });
  });

  it("builds a confirmation redirect URL for verification emails", () => {
    expect(buildSupabaseEmailRedirectUrl("/results/123")).toBe(
      "https://gapyearcode.vercel.app/auth/confirm?next=%2Fresults%2F123",
    );
  });

  it("normalizes invalid next paths back to the dashboard", () => {
    expect(normalizeAuthNextPath("https://example.com/elsewhere")).toBe(
      "/dashboard",
    );
  });

  it("uses the configured public site origin for auth emails", () => {
    expect(getSupabaseEmailRedirectOrigin()).toBe("https://gapyearcode.vercel.app");
  });
});
