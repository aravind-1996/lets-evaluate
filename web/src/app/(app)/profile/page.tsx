import { requireSession } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await requireSession();

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return (
    <ProfileClient
      name={session.user.name}
      email={session.user.email}
      role={session.user.role}
      hasPassword={Boolean(user?.passwordHash)}
    />
  );
}
