const DUPLICATE_ACCOUNT_PATTERNS = [
  "already registered",
  "already been registered",
  "already exists",
  "email_exists",
];

export function normalizePasswordAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Check your email and verify your address before signing in.";
  }

  return message;
}

export function normalizeSignUpErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    DUPLICATE_ACCOUNT_PATTERNS.some((pattern) =>
      normalizedMessage.includes(pattern),
    )
  ) {
    return "An account with this email already exists.";
  }

  return message;
}
