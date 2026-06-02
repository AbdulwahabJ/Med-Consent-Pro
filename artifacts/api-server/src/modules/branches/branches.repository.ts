import { eq, ilike, and, sql } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";
import type { Branch } from "@workspace/db";

export type { Branch };

export async function listBranches(search?: string, activeOnly?: boolean): Promise<Branch[]> {
  const conditions = [];
  if (search) conditions.push(ilike(branchesTable.nameAr, `%${search}%`));
  if (activeOnly) conditions.push(eq(branchesTable.isActive, true));

  return db
    .select()
    .from(branchesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(branchesTable.nameAr);
}

export async function getBranchById(id: number): Promise<Branch | null> {
  const rows = await db.select().from(branchesTable).where(eq(branchesTable.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBranch(data: { nameAr: string; nameEn?: string; address?: string; isActive?: boolean }): Promise<Branch> {
  const [row] = await db
    .insert(branchesTable)
    .values({ nameAr: data.nameAr, nameEn: data.nameEn, address: data.address, isActive: data.isActive ?? true })
    .returning();
  return row;
}

export async function updateBranch(id: number, data: Partial<{ nameAr: string; nameEn: string; address: string; isActive: boolean }>): Promise<Branch | null> {
  await db.update(branchesTable).set(data).where(eq(branchesTable.id, id));
  return getBranchById(id);
}

export async function deleteBranch(id: number): Promise<boolean> {
  const result = await db.delete(branchesTable).where(eq(branchesTable.id, id)).returning({ id: branchesTable.id });
  return result.length > 0;
}

export async function countBranches(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(branchesTable);
  return result[0]?.count ?? 0;
}
