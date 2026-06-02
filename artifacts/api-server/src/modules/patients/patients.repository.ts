import { eq, and, isNull, ilike, or, sql } from "drizzle-orm";
import { db, patientsTable } from "@workspace/db";
import type { Patient } from "@workspace/db";

export type { Patient };

export async function listPatients(
  page: number,
  limit: number,
  search?: string,
): Promise<{ patients: Patient[]; total: number }> {
  const offset = (page - 1) * limit;
  const baseWhere = isNull(patientsTable.deletedAt);
  const whereClause = search
    ? and(
        baseWhere,
        or(
          ilike(patientsTable.fullNameAr, `%${search}%`),
          ilike(patientsTable.fileNumber, `%${search}%`),
          ilike(patientsTable.mobile, `%${search}%`),
          ilike(patientsTable.nationalId, `%${search}%`),
        ),
      )
    : baseWhere;

  const [patients, countResult] = await Promise.all([
    db.select().from(patientsTable).where(whereClause).orderBy(patientsTable.createdAt).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(patientsTable).where(whereClause),
  ]);

  return { patients, total: countResult[0]?.count ?? 0 };
}

export async function getPatientById(id: number): Promise<Patient | null> {
  const rows = await db
    .select()
    .from(patientsTable)
    .where(and(eq(patientsTable.id, id), isNull(patientsTable.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPatientByFileNumber(fileNumber: string): Promise<Patient | null> {
  const rows = await db
    .select()
    .from(patientsTable)
    .where(and(eq(patientsTable.fileNumber, fileNumber), isNull(patientsTable.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPatient(data: {
  fullNameAr: string;
  fileNumber: string;
  nationalId?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  allergies?: string;
  medicalHistory?: string;
  notes?: string;
  isActive?: boolean;
}): Promise<Patient | null> {
  const [inserted] = await db
    .insert(patientsTable)
    .values({
      fullNameAr: data.fullNameAr,
      fileNumber: data.fileNumber,
      nationalId: data.nationalId,
      mobile: data.mobile,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      allergies: data.allergies,
      medicalHistory: data.medicalHistory,
      notes: data.notes,
      isActive: data.isActive ?? true,
    })
    .returning({ id: patientsTable.id });

  if (!inserted) return null;
  return getPatientById(inserted.id);
}

export async function updatePatient(
  id: number,
  data: Partial<{
    fullNameAr: string;
    fileNumber: string;
    nationalId: string;
    mobile: string;
    dateOfBirth: string;
    gender: string;
    allergies: string;
    medicalHistory: string;
    notes: string;
    isActive: boolean;
  }>,
): Promise<Patient | null> {
  await db.update(patientsTable).set(data).where(and(eq(patientsTable.id, id), isNull(patientsTable.deletedAt)));
  return getPatientById(id);
}

export async function softDeletePatient(id: number): Promise<boolean> {
  const result = await db
    .update(patientsTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(patientsTable.id, id), isNull(patientsTable.deletedAt)))
    .returning({ id: patientsTable.id });
  return result.length > 0;
}

export async function countPatients(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable)
    .where(isNull(patientsTable.deletedAt));
  return result[0]?.count ?? 0;
}
