import { db } from "@/lib/db";
import { evaluationEvents } from "@/lib/db/schema";
import { v4 as uuid } from "uuid";

export async function logEvent(input: {
  organizationId: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}) {
  await db.insert(evaluationEvents).values({
    id: uuid(),
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload ?? {},
  });
}
