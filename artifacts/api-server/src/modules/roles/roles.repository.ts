import { eq } from "drizzle-orm";
import { db, rolesTable, rolePermissionsTable, permissionsTable } from "@workspace/db";

export interface RoleWithPermissions {
  id: number;
  name: string;
  displayNameAr: string;
  displayNameEn: string;
  permissions: string[];
}

export async function getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const roles = await db.select().from(rolesTable).orderBy(rolesTable.id);

  const result: RoleWithPermissions[] = [];

  for (const role of roles) {
    const perms = await db
      .select({ key: permissionsTable.key })
      .from(rolePermissionsTable)
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionId, permissionsTable.id))
      .where(eq(rolePermissionsTable.roleId, role.id));

    result.push({
      id: role.id,
      name: role.name,
      displayNameAr: role.displayNameAr,
      displayNameEn: role.displayNameEn,
      permissions: perms.map((p) => p.key),
    });
  }

  return result;
}
