import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid registration data.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const db = getDb();

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await hashPassword(parsed.data.password),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration failed.", error);

    if (
      error instanceof Error &&
      error.message.includes("DATABASE_URL is required")
    ) {
      return NextResponse.json(
        {
          error:
            "Registration is unavailable because the database is not configured.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Unable to process registration right now." },
      { status: 500 },
    );
  }
}
