import { eq, and } from "drizzle-orm";
import { db, templateFieldsTable } from "@workspace/db";

export type FieldRow = typeof templateFieldsTable.$inferSelect;

export interface CreateFieldData {
  templateId: number;
  fieldKey: string;
  label: string;
  type: string;
  pageNumber: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  required: boolean;
}

export interface UpdateFieldData {
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  pageNumber?: number;
  label?: string;
  required?: boolean;
}

export async function listFieldsByTemplate(templateId: number): Promise<FieldRow[]> {
  return db
    .select()
    .from(templateFieldsTable)
    .where(eq(templateFieldsTable.templateId, templateId));
}

export async function findFieldById(templateId: number, fieldId: number): Promise<FieldRow | null> {
  const rows = await db
    .select()
    .from(templateFieldsTable)
    .where(and(eq(templateFieldsTable.templateId, templateId), eq(templateFieldsTable.id, fieldId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createField(data: CreateFieldData): Promise<FieldRow> {
  const [row] = await db.insert(templateFieldsTable).values(data).returning();
  return row!;
}

export async function updateField(templateId: number, fieldId: number, data: UpdateFieldData): Promise<FieldRow | null> {
  const rows = await db
    .update(templateFieldsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(templateFieldsTable.templateId, templateId), eq(templateFieldsTable.id, fieldId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteField(templateId: number, fieldId: number): Promise<void> {
  await db
    .delete(templateFieldsTable)
    .where(and(eq(templateFieldsTable.templateId, templateId), eq(templateFieldsTable.id, fieldId)));
}
