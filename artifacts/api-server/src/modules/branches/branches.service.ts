import * as repo from "./branches.repository";
import { createAuditLog } from "../audit/audit.repository";

export async function listBranches(search?: string, activeOnly?: boolean) {
  return repo.listBranches(search, activeOnly);
}

export async function getBranchById(id: number) {
  return repo.getBranchById(id);
}

export async function createBranch(data: { nameAr: string; nameEn?: string; address?: string; isActive?: boolean }, actorId: number) {
  const branch = await repo.createBranch(data);
  await createAuditLog({ userId: actorId, action: "branch_created", entityType: "branch", entityId: String(branch.id), metadata: { nameAr: data.nameAr } });
  return branch;
}

export async function updateBranch(id: number, data: Partial<{ nameAr: string; nameEn: string; address: string; isActive: boolean }>, actorId: number) {
  const branch = await repo.updateBranch(id, data);
  if (!branch) return null;
  await createAuditLog({ userId: actorId, action: "branch_updated", entityType: "branch", entityId: String(id), metadata: { changes: Object.keys(data) } });
  return branch;
}

export async function deleteBranch(id: number, actorId: number): Promise<boolean> {
  const deleted = await repo.deleteBranch(id);
  if (deleted) {
    await createAuditLog({ userId: actorId, action: "branch_deleted", entityType: "branch", entityId: String(id), metadata: null });
  }
  return deleted;
}
