import { Router, type IRouter } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import { findTemplateById } from "../templates/templates.repository";
import * as repo from "./fields.repository";

const router: IRouter = Router();

const VALID_FIELD_KEYS = [
  "patient_name",
  "patient_id",
  "patient_phone",
  "procedure_name",
  "doctor_name",
  "consent_date",
  "notes",
  "signature",
] as const;

const VALID_TYPES = ["text", "date", "signature"] as const;
const percentRange = z.number().min(0).max(100);

const createFieldSchema = z.object({
  fieldKey: z.enum(VALID_FIELD_KEYS),
  label: z.string().min(1).max(100),
  type: z.enum(VALID_TYPES),
  pageNumber: z.number().int().min(1),
  xPercent: percentRange,
  yPercent: percentRange,
  widthPercent: percentRange,
  heightPercent: percentRange,
  required: z.boolean().optional().default(true),
});

const updateFieldSchema = z.object({
  xPercent: percentRange.optional(),
  yPercent: percentRange.optional(),
  widthPercent: percentRange.optional(),
  heightPercent: percentRange.optional(),
  pageNumber: z.number().int().min(1).optional(),
  label: z.string().min(1).max(100).optional(),
  required: z.boolean().optional(),
});

router.get("/templates/:templateId/fields", authenticate, async (req, res): Promise<void> => {
  const templateId = parseInt(req.params.templateId as string, 10);
  if (isNaN(templateId)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const template = await findTemplateById(templateId);
  if (!template) { res.status(404).json({ error: "القالب غير موجود" }); return; }

  const fields = await repo.listFieldsByTemplate(templateId);
  res.json({ fields });
});

router.post("/templates/:templateId/fields", authenticate, async (req, res): Promise<void> => {
  const templateId = parseInt(req.params.templateId as string, 10);
  if (isNaN(templateId)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const template = await findTemplateById(templateId);
  if (!template) { res.status(404).json({ error: "القالب غير موجود" }); return; }

  const parsed = createFieldSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الحقل غير صحيحة" });
    return;
  }

  const field = await repo.createField({ templateId, ...parsed.data });
  res.status(201).json(field);
});

router.put("/templates/:templateId/fields/:fieldId", authenticate, async (req, res): Promise<void> => {
  const templateId = parseInt(req.params.templateId as string, 10);
  const fieldId = parseInt(req.params.fieldId as string, 10);
  if (isNaN(templateId) || isNaN(fieldId)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const template = await findTemplateById(templateId);
  if (!template) { res.status(404).json({ error: "القالب غير موجود" }); return; }

  const parsed = updateFieldSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات التحديث غير صحيحة" }); return; }

  const updated = await repo.updateField(templateId, fieldId, parsed.data);
  if (!updated) { res.status(404).json({ error: "الحقل غير موجود" }); return; }
  res.json(updated);
});

router.delete("/templates/:templateId/fields/:fieldId", authenticate, async (req, res): Promise<void> => {
  const templateId = parseInt(req.params.templateId as string, 10);
  const fieldId = parseInt(req.params.fieldId as string, 10);
  if (isNaN(templateId) || isNaN(fieldId)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const template = await findTemplateById(templateId);
  if (!template) { res.status(404).json({ error: "القالب غير موجود" }); return; }
  const field = await repo.findFieldById(templateId, fieldId);
  if (!field) { res.status(404).json({ error: "الحقل غير موجود" }); return; }

  await repo.deleteField(templateId, fieldId);
  res.json({ success: true, message: "تم حذف الحقل" });
});

export default router;
