import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  fullNameAr: text("full_name_ar").notNull(),
  fullNameEn: text("full_name_en"),
  department: text("department"),
  mobile: text("mobile"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Doctor = typeof doctorsTable.$inferSelect;
export type InsertDoctor = typeof doctorsTable.$inferInsert;

export const insertDoctorSchema = z.object({
  fullNameAr: z.string().min(1),
  fullNameEn: z.string().optional(),
  department: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});
