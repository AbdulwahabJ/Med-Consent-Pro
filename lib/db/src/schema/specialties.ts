import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const specialtiesTable = pgTable("specialties", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Specialty = typeof specialtiesTable.$inferSelect;
export type InsertSpecialty = typeof specialtiesTable.$inferInsert;

export const insertSpecialtySchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  isActive: z.boolean().optional(),
});
