import { FloatingDock } from "@/components/FloatingDock";
import { requireSession } from "@/lib/auth/rbac";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="min-h-screen pb-24">
      {children}
      <FloatingDock />
    </div>
  );
}
