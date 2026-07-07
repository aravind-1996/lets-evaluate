import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { candidateStages } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { apiError } from "@/lib/api/helpers";
import { readReport } from "@/lib/storage/reports";

type Params = { params: Promise<{ id: string }> };

/** Stream the stored PDF evaluation report for a completed round. */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id: stageId } = await params;
  const [stage] = await db
    .select()
    .from(candidateStages)
    .where(
      and(
        eq(candidateStages.id, stageId),
        eq(candidateStages.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);
  if (!stage) return apiError("Not found", 404);
  if (!stage.reportKey) return apiError("No report available", 404);

  try {
    const buf = await readReport(stage.reportKey);
    const filename = stage.reportFilename ?? "evaluation-report.pdf";
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Report read failed", err);
    return apiError("Report unavailable", 404);
  }
}
