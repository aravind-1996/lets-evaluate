/**
 * Seed default KANINI organization (run after migrations).
 * Usage: npm run db:seed
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { organizations } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  const slug = process.env.ORG_SLUG ?? "kanini";
  const [existing] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing) {
    console.log("Organization already exists:", existing.id);
  } else {
    const id = uuid();
    await db.insert(organizations).values({
      id,
      name: process.env.ORG_NAME ?? "KANINI",
      slug,
    });
    console.log("Created organization:", id);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
