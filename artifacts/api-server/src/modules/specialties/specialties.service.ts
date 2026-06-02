import * as repo from "./specialties.repository";
import { createAuditLog } from "../audit/audit.repository";

export async function listSpecialties(search?: string, activeOnly?: boolean) {
  return repo.listSpecialties(search, activeOnly);
}

export async function getSpecialtyById(id: number) {
  return repo.getSpecialtyById(id);
}

export async function createSpecialty(data: { nameAr: string; nameEn?: string; isActive?: boolean }, actorId: number) {
  const specialty = await repo.createSpecialty(data);
  await createAuditLog({ userId: actorId, action: "specialty_created", entityType: "specialty", entityId: String(specialty.id), metadata: { nameAr: data.nameAr } });
  return specialty;
}

export async function updateSpecialty(id: number, data: Partial<{ nameAr: string; nameEn: string; isActive: boolean }>, actorId: number) {
  const specialty = await repo.updateSpecialty(id, data);
  if (!specialty) return null;
  await createAuditLog({ userId: actorId, action: "specialty_updated", entityType: "specialty", entityId: String(id), metadata: { changes: Object.keys(data) } });
  return specialty;
}

export async function deleteSpecialty(id: number, actorId: number): Promise<boolean> {
  const deleted = await repo.deleteSpecialty(id);
  if (deleted) {
    await createAuditLog({ userId: actorId, action: "specialty_deleted", entityType: "specialty", entityId: String(id), metadata: null });
  }
  return deleted;
}
