import { signInSchema, signUpSchema } from "@/lib/validation/auth";


describe("auth validation", () => {
  it("accepts a valid sign-in payload", () => {
    const result = signInSchema.safeParse({
      email: "alex@example.com",
      password: "supersecret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects short passwords during sign-up", () => {
    const result = signUpSchema.safeParse({
      fullName: "Alex Morgan",
      email: "alex@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords during sign-up", () => {
    const result = signUpSchema.safeParse({
      fullName: "Alex Morgan",
      email: "alex@example.com",
      password: "supersecret123",
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
      "Passwords do not match.",
    );
  });
});
