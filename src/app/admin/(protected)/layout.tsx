import { redirect } from "next/navigation";
import { verificarSessaoAdmin } from "@/lib/auth-admin";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthorized = await verificarSessaoAdmin();

  if (!isAuthorized) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
