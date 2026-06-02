import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { z } from "zod";
import { authenticate } from "../../middlewares/authenticate";
import * as repo from "./templates.repository";
import { formatTemplate } from "./templates.service";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "templates");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.pdf`),
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("يُسمح بملفات PDF فقط"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = upload.single("file");

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

router.post("/templates/upload", authenticate, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "الملف أكبر من الحد المسموح به (10MB)" });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "فشل رفع الملف" });
      return;
    }
    next();
  });
}, async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "يرجى اختيار ملف PDF" });
    return;
  }

  const parsed = createBodySchema.safeParse(req.body);
  if (!parsed.success) {
    fs.unlinkSync(file.path);
    res.status(400).json({ error: "اسم القالب مطلوب" });
    return;
  }

  const template = await repo.createTemplate({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    fileName: file.originalname,
    storagePath: file.filename,
    fileSize: file.size,
    mimeType: file.mimetype,
    createdBy: req.session.userId!,
  });

  res.status(201).json(formatTemplate(template));
});

router.get("/templates", authenticate, async (_req, res): Promise<void> => {
  const templates = await repo.listTemplates();
  res.json({ templates: templates.map(formatTemplate) });
});

router.get("/templates/:id/file", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }

  const template = await repo.findTemplateById(id);
  if (!template) {
    res.status(404).json({ error: "القالب غير موجود" });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, template.storagePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "الملف غير موجود" });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(template.fileName)}"`);
  fs.createReadStream(filePath).pipe(res);
});

router.get("/templates/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }

  const template = await repo.findTemplateById(id);
  if (!template) {
    res.status(404).json({ error: "القالب غير موجود" });
    return;
  }

  res.json(formatTemplate(template));
});

router.delete("/templates/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }

  const template = await repo.findTemplateById(id);
  if (!template) {
    res.status(404).json({ error: "القالب غير موجود" });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, template.storagePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await repo.deleteTemplate(id);
  res.json({ success: true, message: "تم حذف القالب" });
});

export default router;
