import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const domain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (domain && !email.endsWith(`@${domain}`)) {
      return NextResponse.json(
        { error: `Registration restricted to @${domain} emails` },
        { status: 403 },
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const orgSlug = process.env.ORG_SLUG ?? "kanini";
    let [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);

    if (!org) {
      const orgId = uuid();
      await db.insert(organizations).values({
        id: orgId,
        name: process.env.ORG_NAME ?? "KANINI",
        slug: orgSlug,
      });
      org = { id: orgId, name: process.env.ORG_NAME ?? "KANINI", slug: orgSlug, createdAt: new Date() };
    }

    const userId = uuid();
    const passwordHash = await bcrypt.hash(body.password, 12);

    await db.insert(users).values({
      id: userId,
      name: body.name,
      email,
      passwordHash,
    });

    await db.insert(organizationMembers).values({
      id: uuid(),
      organizationId: org.id,
      userId,
      role: "ta",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
