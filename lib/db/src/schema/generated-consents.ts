import { pgTable, text, serial, timestamp, integer, json } from "drizzle-orm/pg-core";

export const generatedConsentsTable = pgTable("generated_consents", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientId: text("patient_id"),
  patientPhone: text("patient_phone"),
  procedureName: text("procedure_name"),
  doctorName: text("doctor_name"),
  consentDate: text("consent_date").notNull(),
  notes: text("notes"),
  generatedFileName: text("generated_file_name").notNull(),
  generatedFilePath: text("generated_file_path").notNull(),
  fieldsSnapshot: json("fields_snapshot").$type<Record<string, unknown>[]>().notNull(),
  valuesSnapshot: json("values_snapshot").$type<Record<string, string>>().notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type GeneratedConsent = typeof generatedConsentsTable.$inferSelect;
