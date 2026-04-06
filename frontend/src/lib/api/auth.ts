import { backendRequest } from "@/lib/api/client";

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
  return backendRequest<RegisterAccountResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      full_name: payload.fullName,
      password: payload.password,
    }),
  });
}
