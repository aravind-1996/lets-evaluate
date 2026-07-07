import { requireSession } from "@/lib/auth/rbac";
import { getCandidateDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { EvaluateClient } from "./EvaluateClient";
import { NewCandidateClient } from "./NewCandidateClient";
import { CabinetPage } from "@/components/CabinetPage";
import { db } from "@/lib/db";
import { projects, roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ResumeMetrics } from "@/lib/ai";

type Params = { params: Promise<{ id: string }> };

export default async function EvaluatePage({ params }: Params) {
  const session = await requireSession();
  const { id } = await params;

  if (id === "new") {
    return (
      <CabinetPage
        title="New case file"
        subtitle="Upload a resume and start TA screening"
        bodyClassName="case-fade-in"
      >
        <NewCandidateClient />
      </CabinetPage>
    );
  }

  const detail = await getCandidateDetail(session.user.organizationId, id);
  if (!detail) notFound();

  const [roleRow] = detail.candidate.roleId
    ? await db
        .select()
        .from(roles)
        .where(eq(roles.id, detail.candidate.roleId))
        .limit(1)
    : [null];

  const [projectRow] = detail.candidate.projectId
    ? await db
        .select()
        .from(projects)
        .where(eq(projects.id, detail.candidate.projectId))
        .limit(1)
    : [null];

  const canScreen =
    (session.user.role === "admin" || session.user.role === "ta") &&
    !["selected", "rejected", "interview_complete"].includes(
      detail.candidate.status,
    );

  const canReview =
    session.user.role === "interviewer" ||
    detail.assignments.some(
      (a) => a.assignment.assignedToId === session.user.id,
    );

  return (
    <EvaluateClient
      candidateId={id}
      candidateName={detail.candidate.name}
      role={roleRow?.name ?? "Role"}
      projectName={projectRow?.name ?? undefined}
      resumeFilename={detail.candidate.resumeFilename ?? undefined}
      canScreen={canScreen && !detail.review}
      canReview={canReview && !!detail.assignments.length}
      initialMetrics={
        (detail.screening?.metrics as Partial<ResumeMetrics> | undefined) ??
        undefined
      }
      initialStandardQuestions={
        (detail.screening?.standardQuestions as { question?: string }[]) ?? []
      }
      initialResumeQuestions={
        (detail.screening?.resumeQuestions as { question?: string }[]) ?? []
      }
      screeningComments={detail.screening?.comments ?? undefined}
    />
  );
}
