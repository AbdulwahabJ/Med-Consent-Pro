import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const DEMO_USERS = [
  { name: "أحمد الزهراني", email: "demo@consent.com", password: "Demo@1234" },
  { name: "سارة المطيري", email: "sara@consent.com", password: "Demo@1234" },
];

export async function seed() {
  logger.info("Starting database seed...");

  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    logger.info("Database already seeded, skipping.");
    logger.info("Seed complete.");
    return;
  }

  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await db.insert(usersTable).values({ name: u.name, email: u.email, passwordHash });
    logger.info({ email: u.email }, "Demo user created");
  }

  logger.info("Seed complete.");
}
