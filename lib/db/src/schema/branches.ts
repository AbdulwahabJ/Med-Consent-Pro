import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Branch = typeof branchesTable.$inferSelect;
export type InsertBranch = typeof branchesTable.$inferInsert;

export const insertBranchSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});
