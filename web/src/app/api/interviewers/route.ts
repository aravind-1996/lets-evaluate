import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInterviewers } from "@/lib/db/queries";
import { apiError } from "@/lib/api/helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);
  const rows = await getInterviewers(session.user.organizationId);
  return NextResponse.json(rows);
}
