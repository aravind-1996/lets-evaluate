import { requireSession, canManageSetup } from "@/lib/auth/rbac";
import { getOrgProjects } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { SetupClient } from "./SetupClient";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const session = await requireSession();
  if (!canManageSetup(session.user.role)) redirect("/people");
  const projects = await getOrgProjects(session.user.organizationId);
  const { tab } = await searchParams;
  const rawTab = Array.isArray(tab) ? tab[0] : tab;
  const initialTab = rawTab === "roles" ? "roles" : "projects";
  return <SetupClient projects={projects} initialTab={initialTab} />;
}
