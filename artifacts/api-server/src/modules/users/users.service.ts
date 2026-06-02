import bcrypt from "bcryptjs";
import * as usersRepo from "./users.repository";
import { createAuditLog } from "../audit/audit.repository";

const SALT_ROUNDS = 12;

export async function listUsers(page: number, limit: number, search?: string) {
  const { users, total } = await usersRepo.listUsers(page, limit, search);
  return {
    users: users.map(formatUserProfile),
    total,
    page,
    limit,
  };
}

export async function getUserById(id: number) {
  const user = await usersRepo.getUserById(id);
  if (!user) return null;
  return formatUserProfile(user);
}

export async function createUser(
  data: {
    email: string;
    password: string;
    fullNameAr: string;
    fullNameEn?: string;
    roleId: number;
    isActive?: boolean;
  },
  actorId: number,
) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await usersRepo.createUser({ ...data, passwordHash });
  if (!user) return null;

  await createAuditLog({
    userId: actorId,
    action: "user_created",
    entityType: "user",
    entityId: String(user.id),
    metadata: { email: data.email, roleId: data.roleId },
  });

  return formatUserProfile(user);
}

export async function updateUser(
  id: number,
  data: {
    email?: string;
    password?: string;
    fullNameAr?: string;
    fullNameEn?: string;
    roleId?: number;
    isActive?: boolean;
  },
  actorId: number,
) {
  const updateData: Parameters<typeof usersRepo.updateUser>[1] = {};
  if (data.email) updateData.email = data.email;
  if (data.fullNameAr) updateData.fullNameAr = data.fullNameAr;
  if (data.fullNameEn !== undefined) updateData.fullNameEn = data.fullNameEn;
  if (data.roleId) updateData.roleId = data.roleId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const user = await usersRepo.updateUser(id, updateData);
  if (!user) return null;

  await createAuditLog({
    userId: actorId,
    action: "user_updated",
    entityType: "user",
    entityId: String(id),
    metadata: { changes: Object.keys(updateData) },
  });

  return formatUserProfile(user);
}

export async function deleteUser(id: number, actorId: number): Promise<boolean> {
  const deleted = await usersRepo.softDeleteUser(id);
  if (deleted) {
    await createAuditLog({
      userId: actorId,
      action: "user_deleted",
      entityType: "user",
      entityId: String(id),
      metadata: null,
    });
  }
  return deleted;
}

function formatUserProfile(user: usersRepo.UserRow) {
  return {
    id: user.id,
    email: user.email,
    fullNameAr: user.fullNameAr,
    fullNameEn: user.fullNameEn,
    roleId: user.roleId,
    roleName: user.roleName,
    roleDisplayNameAr: user.roleDisplayNameAr,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
