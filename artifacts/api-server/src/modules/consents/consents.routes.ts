import { Router, type IRouter } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PDFDocument, rgb } from "pdf-lib";
import { authenticate } from "../../middlewares/authenticate";
import { findTemplateById } from "../templates/templates.repository";
import { listFieldsByTemplate } from "../fields/fields.repository";
import * as repo from "./consents.repository";
import { renderFieldTextToPng } from "../../lib/render-field-text";

const router: IRouter = Router();

const TEMPLATES_DIR = path.join(process.cwd(), "uploads", "templates");
const CONSENTS_DIR = path.join(process.cwd(), "uploads", "generated-consents");
fs.mkdirSync(CONSENTS_DIR, { recursive: true });

const generateSchema = z.object({
  templateId: z.number().int().positive(),
  fieldValues: z.record(z.string(), z.string()),
  signature: z.string().optional().nullable(),
});

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

  const fieldValues = data.fieldValues;

  const requiredFields = fields.filter((f) => f.required && f.type !== "signature");
  for (const field of requiredFields) {
    const val = fieldValues[field.fieldKey];
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

    if (field.type === "signature") {
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

    const rawValue = fieldValues[field.fieldKey] ?? "";
    if (!rawValue || rawValue.trim() === "") continue;

    const initialFontSize = Math.min(fieldHeight * 0.65, 14);

    // Render text as transparent PNG via canvas (Skia handles Arabic shaping,
    // BiDi, and font fallback automatically — no manual reshaping needed)
    const pngBuf = renderFieldTextToPng({
      text: rawValue.trim(),
      fieldWidthPt: fieldWidth,
      fieldHeightPt: fieldHeight,
      initialFontSizePt: initialFontSize,
      paddingPt: 4,
    });

    const textImage = await pdfDoc.embedPng(pngBuf);

    // White background covers template fill-in dots
    page.drawRectangle({
      x: fieldX,
      y: fieldY,
      width: fieldWidth,
      height: fieldHeight,
      color: rgb(1, 1, 1),
      opacity: 1,
      borderWidth: 0,
    });

    // Overlay the rendered text image exactly over the field
    page.drawImage(textImage, {
      x: fieldX,
      y: fieldY,
      width: fieldWidth,
      height: fieldHeight,
    });
  }

  const outBytes = await pdfDoc.save();
  const outFileName = `consent_${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(CONSENTS_DIR, outFileName), outBytes);

  const valuesSnapshot: Record<string, string> = { ...fieldValues };

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

  const today = new Date().toISOString().split("T")[0]!;
  const patientName =
    fieldValues["patient_name"] ??
    Object.values(fieldValues).find((v) => v?.trim()) ??
    "موافقة";
  const consentDate = fieldValues["consent_date"] ?? today;
  const generatedFileName = `موافقة_${patientName}_${consentDate}.pdf`;

  const consent = await repo.createConsent({
    templateId: data.templateId,
    patientName,
    patientId: fieldValues["patient_id"] ?? null,
    patientPhone: fieldValues["patient_phone"] ?? null,
    procedureName: fieldValues["procedure_name"] ?? null,
    doctorName: fieldValues["doctor_name"] ?? null,
    consentDate,
    notes: fieldValues["notes"] ?? null,
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
