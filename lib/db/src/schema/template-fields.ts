import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";

export const templateFieldsTable = pgTable("template_fields", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  fieldKey: text("field_key").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  pageNumber: integer("page_number").notNull().default(1),
  xPercent: real("x_percent").notNull(),
  yPercent: real("y_percent").notNull(),
  widthPercent: real("width_percent").notNull(),
  heightPercent: real("height_percent").notNull(),
  required: boolean("required").notNull().default(true),
  fontSize: integer("font_size").notNull().default(12),
  bold: boolean("bold").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type TemplateField = typeof templateFieldsTable.$inferSelect;
