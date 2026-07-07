import { requireRole } from "@/lib/auth/rbac";
import { getOrgProjects, getOrgRoles } from "@/lib/db/queries";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";
import { Pill } from "@/components/Pill";
import { ButtonLink } from "@/components/Button";
import Link from "next/link";

export default async function OpeningsPage() {
  const session = await requireRole(["admin", "ta"]);
  const [projects, roles] = await Promise.all([
    getOrgProjects(session.user.organizationId),
    getOrgRoles(session.user.organizationId),
  ]);

  const rolesForProject = (projectId: string) =>
    roles.filter(
      (r) =>
        r.projectId === projectId ||
        (r.projectIds as string[] | null)?.includes(projectId),
    );

  const unassigned = roles.filter(
    (r) =>
      !r.projectId &&
      (!(r.projectIds as string[] | null) ||
        (r.projectIds as string[]).length === 0),
  );

  const totalOpenings = roles.length;

  return (
    <CabinetPage
      title="Openings"
      subtitle={`${totalOpenings} open role${totalOpenings !== 1 ? "s" : ""} across ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      actions={
        <ButtonLink href="/setup?tab=roles" className="px-5 py-2 text-[13px]">
          + Add opening
        </ButtonLink>
      }
    >
      {projects.length === 0 ? (
        <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
          No projects yet. Create a project first in{" "}
          <Link href="/setup?tab=projects" className="font-semibold text-[var(--cyan-d)]">
            Configuration → Projects
          </Link>
          .
        </CaseCard>
      ) : (
        <div className="space-y-5">
          {projects.map((project) => {
            const projectRoles = rolesForProject(project.id);
            return (
              <CaseCard key={project.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cream-2)] bg-[var(--cream)] px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-bold">{project.name}</h2>
                    <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                      {(project.techStack ?? []).join(" · ") || "No tech stack configured"}
                    </p>
                  </div>
                  <Pill variant={projectRoles.length ? "cyan" : "neutral"}>
                    {projectRoles.length} opening{projectRoles.length !== 1 ? "s" : ""}
                  </Pill>
                </div>
                {projectRoles.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-[var(--ink-faint)]">
                    No roles linked to this project yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--cream-2)]">
                    {projectRoles.map((role) => (
                      <li
                        key={role.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <strong className="text-[var(--ink)]">{role.name}</strong>
                          {role.level ? (
                            <span className="ml-2 text-xs text-[var(--ink-faint)]">
                              {role.level}
                            </span>
                          ) : null}
                          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-faint)]">
                            {role.requirements || "No requirements captured"}
                          </p>
                        </div>
                        <Pill variant="green">Open</Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </CaseCard>
            );
          })}

          {unassigned.length > 0 && (
            <CaseCard className="overflow-hidden">
              <div className="border-b border-[var(--cream-2)] bg-[var(--cream)] px-5 py-4">
                <h2 className="font-serif text-lg font-bold">Unassigned roles</h2>
                <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                  Roles not yet linked to a project
                </p>
              </div>
              <ul className="divide-y divide-[var(--cream-2)]">
                {unassigned.map((role) => (
                  <li
                    key={role.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <strong className="text-[var(--ink)]">{role.name}</strong>
                    <Pill variant="neutral">No project</Pill>
                  </li>
                ))}
              </ul>
            </CaseCard>
          )}
        </div>
      )}
    </CabinetPage>
  );
}
