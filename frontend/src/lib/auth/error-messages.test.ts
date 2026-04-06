import {
  normalizePasswordAuthErrorMessage,
  normalizeSignUpErrorMessage,
} from "@/lib/auth/error-messages";


describe("auth error message helpers", () => {
  it("maps duplicate signup errors to a clear message", () => {
    expect(
      normalizeSignUpErrorMessage(
        "A user with this email address has already been registered",
      ),
    ).toBe("An account with this email already exists.");
  });

  it("keeps non-duplicate signup errors unchanged", () => {
    expect(normalizeSignUpErrorMessage("Password should be at least 8 characters")).toBe(
      "Password should be at least 8 characters",
    );
  });

  it("maps email confirmation errors during sign-in", () => {
    expect(normalizePasswordAuthErrorMessage("Email not confirmed")).toBe(
      "Check your email and verify your address before signing in.",
    );
  });
});
