import bcrypt from "bcryptjs";
import type { Request } from "express";
import * as authRepo from "./auth.repository";
import { createAuditLog } from "../audit/audit.repository";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: authRepo.UserWithRoleAndPermissions;
}

export async function loginUser(
  email: string,
  password: string,
  req: Request,
): Promise<LoginResult> {
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    return { success: false, error: "بيانات الدخول غير صحيحة" };
  }

  if (!user.isActive) {
    return { success: false, error: "الحساب غير مفعّل" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await createAuditLog({
      userId: null,
      action: "login_failed",
      entityType: "user",
      entityId: String(user.id),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      metadata: { email },
    });
    return { success: false, error: "بيانات الدخول غير صحيحة" };
  }

  await authRepo.updateLastLogin(user.id);

  await createAuditLog({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: String(user.id),
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    metadata: null,
  });

  return { success: true, user };
}

export async function getUserFromSession(userId: number): Promise<authRepo.UserWithRoleAndPermissions | null> {
  return authRepo.findUserById(userId);
}

export function formatAuthUser(user: authRepo.UserWithRoleAndPermissions) {
  return {
    id: user.id,
    email: user.email,
    fullNameAr: user.fullNameAr,
    fullNameEn: user.fullNameEn,
    roleId: user.roleId,
    roleName: user.roleName,
    roleDisplayNameAr: user.roleDisplayNameAr,
    permissions: user.permissions,
    isActive: user.isActive,
  };
}
