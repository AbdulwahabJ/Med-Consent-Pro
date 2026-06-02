import { eq, ilike, and, sql } from "drizzle-orm";
import { db, specialtiesTable } from "@workspace/db";
import type { Specialty } from "@workspace/db";

export type { Specialty };

export async function listSpecialties(search?: string, activeOnly?: boolean): Promise<Specialty[]> {
  const conditions = [];
  if (search) conditions.push(ilike(specialtiesTable.nameAr, `%${search}%`));
  if (activeOnly) conditions.push(eq(specialtiesTable.isActive, true));

  return db
    .select()
    .from(specialtiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(specialtiesTable.nameAr);
}

export async function getSpecialtyById(id: number): Promise<Specialty | null> {
  const rows = await db.select().from(specialtiesTable).where(eq(specialtiesTable.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createSpecialty(data: { nameAr: string; nameEn?: string; isActive?: boolean }): Promise<Specialty> {
  const [row] = await db
    .insert(specialtiesTable)
    .values({ nameAr: data.nameAr, nameEn: data.nameEn, isActive: data.isActive ?? true })
    .returning();
  return row;
}

export async function updateSpecialty(id: number, data: Partial<{ nameAr: string; nameEn: string; isActive: boolean }>): Promise<Specialty | null> {
  await db.update(specialtiesTable).set(data).where(eq(specialtiesTable.id, id));
  return getSpecialtyById(id);
}

export async function deleteSpecialty(id: number): Promise<boolean> {
  const result = await db.delete(specialtiesTable).where(eq(specialtiesTable.id, id)).returning({ id: specialtiesTable.id });
  return result.length > 0;
}

export async function countSpecialties(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(specialtiesTable);
  return result[0]?.count ?? 0;
}
