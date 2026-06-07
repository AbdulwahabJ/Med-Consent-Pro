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
import { getTextSegments } from "../../lib/arabic-text";

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
  signature: z.string().optional().nullable(),
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
  // Latin fallback for digits, punctuation, and non-Arabic chars (/, -, :, etc.)
  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  // Pre-embed signature image if provided
  let signatureImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (data.signature) {
    try {
      const base64Data = data.signature.replace(/^data:image\/png;base64,/, "");
      const sigBytes = Buffer.from(base64Data, "base64");
      signatureImage = await pdfDoc.embedPng(sigBytes);
    } catch {
      // ignore bad signature data
    }
  }

  for (const field of fields) {
    const pageIndex = (field.pageNumber ?? 1) - 1;
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const fieldX = (field.xPercent / 100) * pageWidth;
    const fieldWidth = (field.widthPercent / 100) * pageWidth;
    const fieldHeight = (field.heightPercent / 100) * pageHeight;
    const yFromTop = (field.yPercent / 100) * pageHeight;
    const fieldY = pageHeight - yFromTop - fieldHeight;

    if (field.fieldKey === "signature") {
      if (signatureImage) {
        page.drawImage(signatureImage, {
          x: fieldX,
          y: fieldY,
          width: fieldWidth,
          height: fieldHeight,
        });
      }
      continue;
    }

    const rawValue = FIELD_KEY_TO_VALUE(field.fieldKey, values);
    if (!rawValue || rawValue.trim() === "") continue;

    // Split into shaped Arabic and Latin segments (visual LTR order)
    const segments = getTextSegments(rawValue.trim());
    let fontSize = Math.min(fieldHeight * 0.65, 14);

    // Total width = sum of all segment widths
    const totalWidth = (sz: number) =>
      segments.reduce((sum, seg) => {
        const font = seg.type === "arabic" ? arabicFont : latinFont;
        return sum + font.widthOfTextAtSize(seg.text, sz);
      }, 0);

    let tw = totalWidth(fontSize);
    const padding = 3;
    if (tw > fieldWidth - padding * 2) {
      fontSize = Math.max(6, fontSize * ((fieldWidth - padding * 2) / tw));
      tw = totalWidth(fontSize);
    }

    const textY = fieldY + (fieldHeight - fontSize) / 2;
    const startX = Math.max(fieldX + padding, fieldX + fieldWidth - tw - padding);
    const drawY = Math.max(fieldY + 1, textY);

    // White background clears template's fill-in dots under the text
    page.drawRectangle({
      x: startX - 2,
      y: drawY - 2,
      width: tw + 4,
      height: fontSize + 4,
      color: rgb(1, 1, 1),
      opacity: 1,
      borderWidth: 0,
    });

    // Render segments left-to-right, each with its own font
    let curX = startX;
    for (const seg of segments) {
      const segFont = seg.type === "arabic" ? arabicFont : latinFont;
      const segW = segFont.widthOfTextAtSize(seg.text, fontSize);
      page.drawText(seg.text, {
        x: curX,
        y: drawY,
        size: fontSize,
        font: segFont,
        color: rgb(0.05, 0.05, 0.05),
      });
      curX += segW;
    }
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
