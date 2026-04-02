import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={{ name: user.name, email: user.email }} />
      <main className="page-shell py-8">{children}</main>
    </div>
  );
}
