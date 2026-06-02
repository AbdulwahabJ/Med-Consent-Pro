import { eq, and, isNull, ilike, or, sql } from "drizzle-orm";
import { db, usersTable, rolesTable } from "@workspace/db";

export interface UserRow {
  id: number;
  email: string;
  fullNameAr: string;
  fullNameEn: string | null;
  roleId: number;
  roleName: string;
  roleDisplayNameAr: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSelect = {
  id: usersTable.id,
  email: usersTable.email,
  fullNameAr: usersTable.fullNameAr,
  fullNameEn: usersTable.fullNameEn,
  roleId: usersTable.roleId,
  roleName: rolesTable.name,
  roleDisplayNameAr: rolesTable.displayNameAr,
  isActive: usersTable.isActive,
  lastLoginAt: usersTable.lastLoginAt,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

export async function listUsers(page: number, limit: number, search?: string): Promise<{ users: UserRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const baseWhere = isNull(usersTable.deletedAt);
  const whereClause = search
    ? and(baseWhere, or(ilike(usersTable.fullNameAr, `%${search}%`), ilike(usersTable.email, `%${search}%`)))
    : baseWhere;

  const [users, countResult] = await Promise.all([
    db
      .select(userSelect)
      .from(usersTable)
      .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
      .where(whereClause)
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(whereClause),
  ]);

  return { users, total: countResult[0]?.count ?? 0 };
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const rows = await db
    .select(userSelect)
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  fullNameAr: string;
  fullNameEn?: string;
  roleId: number;
  isActive?: boolean;
}): Promise<UserRow | null> {
  const [inserted] = await db
    .insert(usersTable)
    .values({
      email: data.email,
      passwordHash: data.passwordHash,
      fullNameAr: data.fullNameAr,
      fullNameEn: data.fullNameEn,
      roleId: data.roleId,
      isActive: data.isActive ?? true,
    })
    .returning({ id: usersTable.id });

  if (!inserted) return null;
  return getUserById(inserted.id);
}

export async function updateUser(
  id: number,
  data: Partial<{
    email: string;
    passwordHash: string;
    fullNameAr: string;
    fullNameEn: string;
    roleId: number;
    isActive: boolean;
  }>,
): Promise<UserRow | null> {
  await db
    .update(usersTable)
    .set(data)
    .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)));

  return getUserById(id);
}

export async function softDeleteUser(id: number): Promise<boolean> {
  const result = await db
    .update(usersTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
    .returning({ id: usersTable.id });

  return result.length > 0;
}

export async function countActiveUsers(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(and(eq(usersTable.isActive, true), isNull(usersTable.deletedAt)));
  return result[0]?.count ?? 0;
}

export async function countTotalUsers(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(isNull(usersTable.deletedAt));
  return result[0]?.count ?? 0;
}
