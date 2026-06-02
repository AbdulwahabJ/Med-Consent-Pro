import { eq, and, isNull, ilike, or, sql } from "drizzle-orm";
import { db, doctorsTable, specialtiesTable, branchesTable } from "@workspace/db";

export interface DoctorRow {
  id: number;
  fullNameAr: string;
  fullNameEn: string | null;
  specialtyId: number;
  specialtyNameAr: string;
  branchId: number;
  branchNameAr: string;
  mobile: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSelect = {
  id: doctorsTable.id,
  fullNameAr: doctorsTable.fullNameAr,
  fullNameEn: doctorsTable.fullNameEn,
  specialtyId: doctorsTable.specialtyId,
  specialtyNameAr: specialtiesTable.nameAr,
  branchId: doctorsTable.branchId,
  branchNameAr: branchesTable.nameAr,
  mobile: doctorsTable.mobile,
  email: doctorsTable.email,
  isActive: doctorsTable.isActive,
  createdAt: doctorsTable.createdAt,
  updatedAt: doctorsTable.updatedAt,
};

export async function listDoctors(
  page: number,
  limit: number,
  search?: string,
  specialtyId?: number,
  branchId?: number,
  isActive?: boolean,
): Promise<{ doctors: DoctorRow[]; total: number }> {
  const offset = (page - 1) * limit;

  const conditions = [isNull(doctorsTable.deletedAt)];
  if (search) conditions.push(or(ilike(doctorsTable.fullNameAr, `%${search}%`), ilike(doctorsTable.fullNameEn, `%${search}%`))!);
  if (specialtyId) conditions.push(eq(doctorsTable.specialtyId, specialtyId));
  if (branchId) conditions.push(eq(doctorsTable.branchId, branchId));
  if (isActive !== undefined) conditions.push(eq(doctorsTable.isActive, isActive));

  const whereClause = and(...conditions);

  const [doctors, countResult] = await Promise.all([
    db
      .select(doctorSelect)
      .from(doctorsTable)
      .innerJoin(specialtiesTable, eq(doctorsTable.specialtyId, specialtiesTable.id))
      .innerJoin(branchesTable, eq(doctorsTable.branchId, branchesTable.id))
      .where(whereClause)
      .orderBy(doctorsTable.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(doctorsTable)
      .where(whereClause),
  ]);

  return { doctors, total: countResult[0]?.count ?? 0 };
}

export async function getDoctorById(id: number): Promise<DoctorRow | null> {
  const rows = await db
    .select(doctorSelect)
    .from(doctorsTable)
    .innerJoin(specialtiesTable, eq(doctorsTable.specialtyId, specialtiesTable.id))
    .innerJoin(branchesTable, eq(doctorsTable.branchId, branchesTable.id))
    .where(and(eq(doctorsTable.id, id), isNull(doctorsTable.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createDoctor(data: {
  fullNameAr: string;
  fullNameEn?: string;
  specialtyId: number;
  branchId: number;
  mobile?: string;
  email?: string;
  isActive?: boolean;
}): Promise<DoctorRow | null> {
  const [inserted] = await db
    .insert(doctorsTable)
    .values({
      fullNameAr: data.fullNameAr,
      fullNameEn: data.fullNameEn,
      specialtyId: data.specialtyId,
      branchId: data.branchId,
      mobile: data.mobile,
      email: data.email,
      isActive: data.isActive ?? true,
    })
    .returning({ id: doctorsTable.id });

  if (!inserted) return null;
  return getDoctorById(inserted.id);
}

export async function updateDoctor(
  id: number,
  data: Partial<{
    fullNameAr: string;
    fullNameEn: string;
    specialtyId: number;
    branchId: number;
    mobile: string;
    email: string;
    isActive: boolean;
  }>,
): Promise<DoctorRow | null> {
  await db.update(doctorsTable).set(data).where(and(eq(doctorsTable.id, id), isNull(doctorsTable.deletedAt)));
  return getDoctorById(id);
}

export async function softDeleteDoctor(id: number): Promise<boolean> {
  const result = await db
    .update(doctorsTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(doctorsTable.id, id), isNull(doctorsTable.deletedAt)))
    .returning({ id: doctorsTable.id });
  return result.length > 0;
}

export async function countDoctors(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(doctorsTable)
    .where(isNull(doctorsTable.deletedAt));
  return result[0]?.count ?? 0;
}
