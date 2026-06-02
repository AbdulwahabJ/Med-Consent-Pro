import { eq, and, isNull } from "drizzle-orm";
import { db, usersTable, rolesTable, permissionsTable, rolePermissionsTable } from "@workspace/db";

export interface UserWithRoleAndPermissions {
  id: number;
  email: string;
  passwordHash: string;
  fullNameAr: string;
  fullNameEn: string | null;
  roleId: number;
  roleName: string;
  roleDisplayNameAr: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function findUserByEmail(email: string): Promise<UserWithRoleAndPermissions | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      passwordHash: usersTable.passwordHash,
      fullNameAr: usersTable.fullNameAr,
      fullNameEn: usersTable.fullNameEn,
      roleId: usersTable.roleId,
      roleName: rolesTable.name,
      roleDisplayNameAr: rolesTable.displayNameAr,
      isActive: usersTable.isActive,
      lastLoginAt: usersTable.lastLoginAt,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      deletedAt: usersTable.deletedAt,
    })
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)))
    .limit(1);

  if (!rows[0]) return null;

  const permissions = await getUserPermissions(rows[0].roleId);

  return { ...rows[0], permissions };
}

export async function findUserById(id: number): Promise<UserWithRoleAndPermissions | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      passwordHash: usersTable.passwordHash,
      fullNameAr: usersTable.fullNameAr,
      fullNameEn: usersTable.fullNameEn,
      roleId: usersTable.roleId,
      roleName: rolesTable.name,
      roleDisplayNameAr: rolesTable.displayNameAr,
      isActive: usersTable.isActive,
      lastLoginAt: usersTable.lastLoginAt,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
      deletedAt: usersTable.deletedAt,
    })
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
    .limit(1);

  if (!rows[0]) return null;

  const permissions = await getUserPermissions(rows[0].roleId);

  return { ...rows[0], permissions };
}

export async function updateLastLogin(userId: number): Promise<void> {
  await db
    .update(usersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(usersTable.id, userId));
}

async function getUserPermissions(roleId: number): Promise<string[]> {
  const rows = await db
    .select({ key: permissionsTable.key })
    .from(rolePermissionsTable)
    .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
    .where(eq(rolePermissionsTable.roleId, roleId));

  return rows.map((r) => r.key);
}
