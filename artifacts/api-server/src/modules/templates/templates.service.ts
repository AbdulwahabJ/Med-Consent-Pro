import type { TemplateRow } from "./templates.repository";

export interface ConsentTemplateDTO {
  id: number;
  name: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export function formatTemplate(row: TemplateRow): ConsentTemplateDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    fileName: row.fileName,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
