import * as repo from "./doctors.repository";
import { createAuditLog } from "../audit/audit.repository";

export async function listDoctors(
  page: number,
  limit: number,
  search?: string,
  specialtyId?: number,
  branchId?: number,
  isActive?: boolean,
) {
  const { doctors, total } = await repo.listDoctors(page, limit, search, specialtyId, branchId, isActive);
  return { doctors: doctors.map(formatDoctor), total, page, limit };
}

export async function getDoctorById(id: number) {
  const doctor = await repo.getDoctorById(id);
  if (!doctor) return null;
  return formatDoctor(doctor);
}

export async function createDoctor(
  data: {
    fullNameAr: string;
    fullNameEn?: string;
    specialtyId: number;
    branchId: number;
    mobile?: string;
    email?: string;
    isActive?: boolean;
  },
  actorId: number,
) {
  const doctor = await repo.createDoctor(data);
  if (!doctor) return null;
  await createAuditLog({
    userId: actorId,
    action: "doctor_created",
    entityType: "doctor",
    entityId: String(doctor.id),
    metadata: { fullNameAr: data.fullNameAr },
  });
  return formatDoctor(doctor);
}

export async function updateDoctor(
  id: number,
  data: Partial<{
    fullNameAr: string;
    fullNameEn: string;
    specialtyId: number;
    branchId: number;
    mobile: string;
    email: string;
    isActive: boolean;
  }>,
  actorId: number,
) {
  const doctor = await repo.updateDoctor(id, data);
  if (!doctor) return null;
  await createAuditLog({
    userId: actorId,
    action: "doctor_updated",
    entityType: "doctor",
    entityId: String(id),
    metadata: { changes: Object.keys(data) },
  });
  return formatDoctor(doctor);
}

export async function deleteDoctor(id: number, actorId: number): Promise<boolean> {
  const deleted = await repo.softDeleteDoctor(id);
  if (deleted) {
    await createAuditLog({ userId: actorId, action: "doctor_deleted", entityType: "doctor", entityId: String(id), metadata: null });
  }
  return deleted;
}

function formatDoctor(d: repo.DoctorRow) {
  return {
    id: d.id,
    fullNameAr: d.fullNameAr,
    fullNameEn: d.fullNameEn,
    specialtyId: d.specialtyId,
    specialtyNameAr: d.specialtyNameAr,
    branchId: d.branchId,
    branchNameAr: d.branchNameAr,
    mobile: d.mobile,
    email: d.email,
    isActive: d.isActive,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}
