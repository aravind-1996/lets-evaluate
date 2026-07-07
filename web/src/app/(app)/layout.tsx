import { CabinetShell } from "@/components/CabinetShell";
import { requireSession } from "@/lib/auth/rbac";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <CabinetShell userName={session.user.name} userRole={session.user.role}>
      {children}
    </CabinetShell>
  );
}
