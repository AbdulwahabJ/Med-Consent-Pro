import { eq, desc } from "drizzle-orm";
import { db, consentTemplatesTable } from "@workspace/db";

export type TemplateRow = typeof consentTemplatesTable.$inferSelect;

export interface CreateTemplateData {
  name: string;
  description: string | null;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  createdBy: number;
}

export async function listTemplates(): Promise<TemplateRow[]> {
  return db
    .select()
    .from(consentTemplatesTable)
    .orderBy(desc(consentTemplatesTable.createdAt));
}

export async function findTemplateById(id: number): Promise<TemplateRow | null> {
  const rows = await db
    .select()
    .from(consentTemplatesTable)
    .where(eq(consentTemplatesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTemplate(data: CreateTemplateData): Promise<TemplateRow> {
  const [row] = await db
    .insert(consentTemplatesTable)
    .values(data)
    .returning();
  return row!;
}

export async function deleteTemplate(id: number): Promise<void> {
  await db.delete(consentTemplatesTable).where(eq(consentTemplatesTable.id, id));
}
