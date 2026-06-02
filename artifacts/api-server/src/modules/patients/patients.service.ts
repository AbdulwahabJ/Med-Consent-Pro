import * as repo from "./patients.repository";
import { createAuditLog } from "../audit/audit.repository";

export async function listPatients(page: number, limit: number, search?: string) {
  const { patients, total } = await repo.listPatients(page, limit, search);
  return { patients: patients.map(formatPatient), total, page, limit };
}

export async function getPatientById(id: number) {
  const patient = await repo.getPatientById(id);
  if (!patient) return null;
  return formatPatient(patient);
}

export async function createPatient(
  data: {
    fullNameAr: string;
    fileNumber: string;
    nationalId?: string;
    mobile?: string;
    dateOfBirth?: string;
    gender?: string;
    allergies?: string;
    medicalHistory?: string;
    notes?: string;
    isActive?: boolean;
  },
  actorId: number,
) {
  const existing = await repo.getPatientByFileNumber(data.fileNumber);
  if (existing) {
    return { error: "رقم الملف مستخدم بالفعل" };
  }

  const patient = await repo.createPatient(data);
  if (!patient) return null;

  await createAuditLog({
    userId: actorId,
    action: "patient_created",
    entityType: "patient",
    entityId: String(patient.id),
    metadata: { fileNumber: data.fileNumber, fullNameAr: data.fullNameAr },
  });

  return formatPatient(patient);
}

export async function updatePatient(
  id: number,
  data: Partial<{
    fullNameAr: string;
    fileNumber: string;
    nationalId: string;
    mobile: string;
    dateOfBirth: string;
    gender: string;
    allergies: string;
    medicalHistory: string;
    notes: string;
    isActive: boolean;
  }>,
  actorId: number,
) {
  if (data.fileNumber) {
    const existing = await repo.getPatientByFileNumber(data.fileNumber);
    if (existing && existing.id !== id) {
      return { error: "رقم الملف مستخدم بالفعل" };
    }
  }

  const patient = await repo.updatePatient(id, data);
  if (!patient) return null;

  await createAuditLog({
    userId: actorId,
    action: "patient_updated",
    entityType: "patient",
    entityId: String(id),
    metadata: { changes: Object.keys(data) },
  });

  return formatPatient(patient);
}

export async function deletePatient(id: number, actorId: number): Promise<boolean> {
  const deleted = await repo.softDeletePatient(id);
  if (deleted) {
    await createAuditLog({ userId: actorId, action: "patient_deleted", entityType: "patient", entityId: String(id), metadata: null });
  }
  return deleted;
}

function formatPatient(p: repo.Patient) {
  return {
    id: p.id,
    fullNameAr: p.fullNameAr,
    fileNumber: p.fileNumber,
    nationalId: p.nationalId,
    mobile: p.mobile,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    allergies: p.allergies,
    medicalHistory: p.medicalHistory,
    notes: p.notes,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
