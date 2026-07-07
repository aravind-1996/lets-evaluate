import { requireSession, canManageSetup } from "@/lib/auth/rbac";
import { getOrgProjects } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { RolesClient } from "../SetupClient";

export default async function RolesPage() {
  const session = await requireSession();
  if (!canManageSetup(session.user.role)) redirect("/people");
  const projects = await getOrgProjects(session.user.organizationId);
  return <RolesClient projects={projects} />;
}
