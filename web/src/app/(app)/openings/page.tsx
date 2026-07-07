import { requireRole } from "@/lib/auth/rbac";
import {
  getOrgProjects,
  getOrgRoles,
  getRoleCandidateStats,
} from "@/lib/db/queries";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";
import { ButtonLink } from "@/components/Button";
import Link from "next/link";
import { OpeningsBoard, type OpeningRole } from "./OpeningsBoard";

export default async function OpeningsPage() {
  const session = await requireRole(["admin"]);
  const [projects, roles, stats] = await Promise.all([
    getOrgProjects(session.user.organizationId),
    getOrgRoles(session.user.organizationId),
    getRoleCandidateStats(session.user.organizationId),
  ]);

  const openRoles: OpeningRole[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level,
    requirements: r.requirements,
    projectId: r.projectId,
    projectIds: (r.projectIds as string[] | null) ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    closedAt: r.closedAt ? r.closedAt.toISOString() : null,
  }));

  const totalOpen = openRoles.filter((r) => r.status === "open").length;

  return (
    <CabinetPage
      title="Openings"
      subtitle={`${totalOpen} open role${totalOpen !== 1 ? "s" : ""} across ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      actions={
        <ButtonLink href="/setup/roles" className="px-5 py-2 text-[13px]">
          + Add opening
        </ButtonLink>
      }
    >
      {projects.length === 0 ? (
        <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
          No projects yet. Create a project first in{" "}
          <Link href="/setup/projects" className="font-semibold text-[var(--cyan-d)]">
            Configuration → Projects
          </Link>
          .
        </CaseCard>
      ) : (
        <OpeningsBoard
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            techStack: (p.techStack as string[] | null) ?? [],
          }))}
          roles={openRoles}
          stats={stats}
        />
      )}
    </CabinetPage>
  );
}
