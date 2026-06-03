import { Router, type IRouter } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { authenticate } from "../../middlewares/authenticate";
import { findTemplateById } from "../templates/templates.repository";
import { listFieldsByTemplate } from "../fields/fields.repository";
import * as repo from "./consents.repository";

const router: IRouter = Router();

const TEMPLATES_DIR = path.join(process.cwd(), "uploads", "templates");
const CONSENTS_DIR = path.join(process.cwd(), "uploads", "generated-consents");
fs.mkdirSync(CONSENTS_DIR, { recursive: true });

const FONT_PATH = path.join(process.cwd(), "src", "assets", "fonts", "NotoNaskhArabic-Regular.ttf");

const generateSchema = z.object({
  templateId: z.number().int().positive(),
  patient_name: z.string().min(1).max(200),
  patient_id: z.string().max(100).optional().nullable(),
  patient_phone: z.string().max(50).optional().nullable(),
  procedure_name: z.string().max(200).optional().nullable(),
  doctor_name: z.string().max(200).optional().nullable(),
  consent_date: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
});

const FIELD_KEY_TO_VALUE = (
  key: string,
  vals: Record<string, string | null | undefined>
): string => {
  const map: Record<string, string | null | undefined> = {
    patient_name: vals.patient_name,
    patient_id: vals.patient_id,
    patient_phone: vals.patient_phone,
    procedure_name: vals.procedure_name,
    doctor_name: vals.doctor_name,
    consent_date: vals.consent_date,
    notes: vals.notes,
    signature: "",
  };
  return map[key] ?? "";
};

function formatConsentResponse(
  consent: Awaited<ReturnType<typeof repo.findConsentById>>
) {
  if (!consent) return null;
  return {
    id: consent.id,
    templateId: consent.templateId,
    templateName: consent.templateName,
    patientName: consent.patientName,
    patientId: consent.patientId,
    patientPhone: consent.patientPhone,
    procedureName: consent.procedureName,
    doctorName: consent.doctorName,
    consentDate: consent.consentDate,
    notes: consent.notes,
    generatedFileName: consent.generatedFileName,
    createdBy: consent.createdBy,
    createdAt: consent.createdAt,
    updatedAt: consent.updatedAt,
  };
}

router.get("/consents", authenticate, async (_req, res): Promise<void> => {
  const consents = await repo.listConsents();
  res.json({ consents: consents.map((c) => formatConsentResponse(c)) });
});

router.get("/consents/:id/file", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }

  const consent = await repo.findConsentById(id);
  if (!consent) { res.status(404).json({ error: "الموافقة غير موجودة" }); return; }

  const filePath = path.join(CONSENTS_DIR, consent.generatedFilePath);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "الملف غير موجود" }); return; }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(consent.generatedFileName)}"`);
  fs.createReadStream(filePath).pipe(res);
});

router.get("/consents/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }

  const consent = await repo.findConsentById(id);
  if (!consent) { res.status(404).json({ error: "الموافقة غير موجودة" }); return; }

  res.json(formatConsentResponse(consent));
});

router.post("/consents/generate", authenticate, async (req, res): Promise<void> => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الموافقة غير صحيحة" });
    return;
  }

  const data = parsed.data;

  const template = await findTemplateById(data.templateId);
  if (!template) { res.status(404).json({ error: "القالب غير موجود" }); return; }

  const fields = await listFieldsByTemplate(data.templateId);
  if (fields.length === 0) {
    res.status(400).json({ error: "لا توجد حقول مربوطة بهذا القالب. يرجى ربط الحقول أولاً." });
    return;
  }

  const requiredFields = fields.filter((f) => f.required && f.fieldKey !== "signature");
  const values: Record<string, string | null | undefined> = {
    patient_name: data.patient_name,
    patient_id: data.patient_id,
    patient_phone: data.patient_phone,
    procedure_name: data.procedure_name,
    doctor_name: data.doctor_name,
    consent_date: data.consent_date,
    notes: data.notes,
  };

  for (const field of requiredFields) {
    const val = values[field.fieldKey];
    if (!val || val.trim() === "") {
      res.status(400).json({ error: `الحقل "${field.label}" مطلوب` });
      return;
    }
  }

  const templateFilePath = path.join(TEMPLATES_DIR, template.storagePath);
  if (!fs.existsSync(templateFilePath)) {
    res.status(404).json({ error: "ملف القالب غير موجود" });
    return;
  }

  const pdfBytes = fs.readFileSync(templateFilePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  let arabicFont: Awaited<ReturnType<typeof pdfDoc.embedFont>>;
  try {
    const fontBytes = fs.readFileSync(FONT_PATH);
    arabicFont = await pdfDoc.embedFont(fontBytes, { subset: false });
  } catch {
    arabicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pages = pdfDoc.getPages();

  for (const field of fields) {
    if (field.fieldKey === "signature") continue;
    const value = FIELD_KEY_TO_VALUE(field.fieldKey, values);
    if (!value || value.trim() === "") continue;

    const pageIndex = (field.pageNumber ?? 1) - 1;
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();

    const fieldX = (field.xPercent / 100) * pageWidth;
    const fieldWidth = (field.widthPercent / 100) * pageWidth;
    const fieldHeight = (field.heightPercent / 100) * pageHeight;
    const yFromTop = (field.yPercent / 100) * pageHeight;
    const fieldY = pageHeight - yFromTop - fieldHeight;

    let fontSize = Math.min(fieldHeight * 0.65, 14);
    const text = value.trim();

    let textWidth = arabicFont.widthOfTextAtSize(text, fontSize);
    if (textWidth > fieldWidth - 4) {
      fontSize = Math.max(6, fontSize * ((fieldWidth - 4) / textWidth));
      textWidth = arabicFont.widthOfTextAtSize(text, fontSize);
    }

    const textX = fieldX + fieldWidth - textWidth - 2;
    const textY = fieldY + (fieldHeight - fontSize) / 2;

    page.drawText(text, {
      x: Math.max(fieldX, textX),
      y: Math.max(fieldY + 1, textY),
      size: fontSize,
      font: arabicFont,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth: fieldWidth - 4,
    });
  }

  const outBytes = await pdfDoc.save();
  const outFileName = `consent_${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(CONSENTS_DIR, outFileName), outBytes);

  const valuesSnapshot: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v != null) valuesSnapshot[k] = v;
  }

  const fieldsSnapshot = fields.map((f) => ({
    id: f.id,
    fieldKey: f.fieldKey,
    label: f.label,
    type: f.type,
    pageNumber: f.pageNumber,
    xPercent: f.xPercent,
    yPercent: f.yPercent,
    widthPercent: f.widthPercent,
    heightPercent: f.heightPercent,
    required: f.required,
  }));

  const generatedFileName = `موافقة_${data.patient_name}_${data.consent_date}.pdf`;

  const consent = await repo.createConsent({
    templateId: data.templateId,
    patientName: data.patient_name,
    patientId: data.patient_id ?? null,
    patientPhone: data.patient_phone ?? null,
    procedureName: data.procedure_name ?? null,
    doctorName: data.doctor_name ?? null,
    consentDate: data.consent_date,
    notes: data.notes ?? null,
    generatedFileName,
    generatedFilePath: outFileName,
    fieldsSnapshot,
    valuesSnapshot,
    createdBy: req.session.userId!,
  });

  const full = await repo.findConsentById(consent.id);
  res.status(201).json(formatConsentResponse(full));
});

router.delete("/consents/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }

  const consent = await repo.findConsentById(id);
  if (!consent) { res.status(404).json({ error: "الموافقة غير موجودة" }); return; }

  const filePath = path.join(CONSENTS_DIR, consent.generatedFilePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await repo.deleteConsent(id);
  res.json({ success: true, message: "تم حذف الموافقة" });
});

export default router;
