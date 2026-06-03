import { eq, desc } from "drizzle-orm";
import { db, generatedConsentsTable, consentTemplatesTable } from "@workspace/db";

export type ConsentRow = typeof generatedConsentsTable.$inferSelect;

export interface CreateConsentData {
  templateId: number;
  patientName: string;
  patientId: string | null;
  patientPhone: string | null;
  procedureName: string | null;
  doctorName: string | null;
  consentDate: string;
  notes: string | null;
  generatedFileName: string;
  generatedFilePath: string;
  fieldsSnapshot: Record<string, unknown>[];
  valuesSnapshot: Record<string, string>;
  createdBy: number;
}

export async function listConsents(): Promise<(ConsentRow & { templateName: string })[]> {
  const rows = await db
    .select({
      id: generatedConsentsTable.id,
      templateId: generatedConsentsTable.templateId,
      patientName: generatedConsentsTable.patientName,
      patientId: generatedConsentsTable.patientId,
      patientPhone: generatedConsentsTable.patientPhone,
      procedureName: generatedConsentsTable.procedureName,
      doctorName: generatedConsentsTable.doctorName,
      consentDate: generatedConsentsTable.consentDate,
      notes: generatedConsentsTable.notes,
      generatedFileName: generatedConsentsTable.generatedFileName,
      generatedFilePath: generatedConsentsTable.generatedFilePath,
      fieldsSnapshot: generatedConsentsTable.fieldsSnapshot,
      valuesSnapshot: generatedConsentsTable.valuesSnapshot,
      createdBy: generatedConsentsTable.createdBy,
      createdAt: generatedConsentsTable.createdAt,
      updatedAt: generatedConsentsTable.updatedAt,
      templateName: consentTemplatesTable.name,
    })
    .from(generatedConsentsTable)
    .leftJoin(consentTemplatesTable, eq(generatedConsentsTable.templateId, consentTemplatesTable.id))
    .orderBy(desc(generatedConsentsTable.createdAt));

  return rows.map((r) => ({ ...r, templateName: r.templateName ?? "محذوف" }));
}

export async function findConsentById(id: number): Promise<(ConsentRow & { templateName: string }) | null> {
  const rows = await db
    .select({
      id: generatedConsentsTable.id,
      templateId: generatedConsentsTable.templateId,
      patientName: generatedConsentsTable.patientName,
      patientId: generatedConsentsTable.patientId,
      patientPhone: generatedConsentsTable.patientPhone,
      procedureName: generatedConsentsTable.procedureName,
      doctorName: generatedConsentsTable.doctorName,
      consentDate: generatedConsentsTable.consentDate,
      notes: generatedConsentsTable.notes,
      generatedFileName: generatedConsentsTable.generatedFileName,
      generatedFilePath: generatedConsentsTable.generatedFilePath,
      fieldsSnapshot: generatedConsentsTable.fieldsSnapshot,
      valuesSnapshot: generatedConsentsTable.valuesSnapshot,
      createdBy: generatedConsentsTable.createdBy,
      createdAt: generatedConsentsTable.createdAt,
      updatedAt: generatedConsentsTable.updatedAt,
      templateName: consentTemplatesTable.name,
    })
    .from(generatedConsentsTable)
    .leftJoin(consentTemplatesTable, eq(generatedConsentsTable.templateId, consentTemplatesTable.id))
    .where(eq(generatedConsentsTable.id, id))
    .limit(1);

  if (!rows[0]) return null;
  return { ...rows[0], templateName: rows[0].templateName ?? "محذوف" };
}

export async function createConsent(data: CreateConsentData): Promise<ConsentRow> {
  const [row] = await db.insert(generatedConsentsTable).values(data).returning();
  return row!;
}

export async function deleteConsent(id: number): Promise<void> {
  await db.delete(generatedConsentsTable).where(eq(generatedConsentsTable.id, id));
}
