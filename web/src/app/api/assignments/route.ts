import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAssignmentsForUser } from "@/lib/db/queries";
import { apiError } from "@/lib/api/helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const rows = await getAssignmentsForUser(
    session.user.organizationId,
    session.user.id,
  );
  return NextResponse.json(rows);
}
