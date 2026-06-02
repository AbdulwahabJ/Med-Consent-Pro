import bcrypt from "bcryptjs";
import * as authRepo from "./auth.repository";

export type AuthUserDTO = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: authRepo.UserRow;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  user?: authRepo.UserRow;
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    return { success: false, error: "بيانات الدخول غير صحيحة" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "بيانات الدخول غير صحيحة" };
  }

  return { success: true, user };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const exists = await authRepo.emailExists(email);
  if (exists) {
    return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await authRepo.createUser(name, email, passwordHash);
  return { success: true, user };
}

export async function getUserFromSession(userId: number): Promise<authRepo.UserRow | null> {
  return authRepo.findUserById(userId);
}

export function formatAuthUser(user: authRepo.UserRow): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
