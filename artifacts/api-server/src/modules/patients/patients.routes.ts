import { Router, type IRouter } from "express";
import * as service from "./patients.service";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { z } from "zod";

const router: IRouter = Router();

const IdParam = z.object({ id: z.coerce.number().int().positive() });
const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
const CreateBody = z.object({
  fullNameAr: z.string().min(1, "الاسم الكامل مطلوب"),
  fileNumber: z.string().min(1, "رقم الملف مطلوب"),
  nationalId: z.string().optional(),
  mobile: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});
const UpdateBody = CreateBody.partial();

router.get("/patients", authenticate, authorize("create_patient"), async (req, res): Promise<void> => {
  const query = ListQuery.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const result = await service.listPatients(query.data.page, query.data.limit, query.data.search);
  res.json(result);
});

router.post("/patients", authenticate, authorize("create_patient"), async (req, res): Promise<void> => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const result = await service.createPatient(parsed.data, req.session.userId!);
  if (!result) { res.status(500).json({ error: "فشل إنشاء المريض" }); return; }
  if ("error" in result) { res.status(409).json({ error: result.error }); return; }
  res.status(201).json(result);
});

router.get("/patients/:id", authenticate, authorize("create_patient"), async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const patient = await service.getPatientById(params.data.id);
  if (!patient) { res.status(404).json({ error: "المريض غير موجود" }); return; }
  res.json(patient);
});

router.patch("/patients/:id", authenticate, authorize("create_patient"), async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const result = await service.updatePatient(params.data.id, parsed.data, req.session.userId!);
  if (!result) { res.status(404).json({ error: "المريض غير موجود" }); return; }
  if ("error" in result) { res.status(409).json({ error: result.error }); return; }
  res.json(result);
});

router.delete("/patients/:id", authenticate, authorize("create_patient"), async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const deleted = await service.deletePatient(params.data.id, req.session.userId!);
  if (!deleted) { res.status(404).json({ error: "المريض غير موجود" }); return; }
  res.json({ success: true, message: "تم حذف المريض" });
});

export default router;
