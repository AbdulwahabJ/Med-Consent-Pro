import { pgTable, text, serial, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  fullNameAr: text("full_name_ar").notNull(),
  fileNumber: text("file_number").notNull().unique(),
  nationalId: text("national_id"),
  mobile: text("mobile"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;

export const insertPatientSchema = z.object({
  fullNameAr: z.string().min(1),
  fileNumber: z.string().min(1),
  nationalId: z.string().optional(),
  mobile: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});
