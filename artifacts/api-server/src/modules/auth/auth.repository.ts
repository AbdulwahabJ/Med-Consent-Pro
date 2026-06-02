import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export type UserRow = typeof usersTable.$inferSelect;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash })
    .returning();
  return user!;
}

export async function emailExists(email: string): Promise<boolean> {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  return rows.length > 0;
}
