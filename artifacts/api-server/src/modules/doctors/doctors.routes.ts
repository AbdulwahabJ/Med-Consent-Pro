import { Router, type IRouter } from "express";
import * as service from "./doctors.service";
import { authenticate } from "../../middlewares/authenticate";
import { z } from "zod";

const router: IRouter = Router();

const IdParam = z.object({ id: z.coerce.number().int().positive() });
const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
const CreateBody = z.object({
  fullNameAr: z.string().min(1, "الاسم العربي مطلوب"),
  fullNameEn: z.string().optional(),
  department: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
  isActive: z.boolean().optional(),
});
const UpdateBody = CreateBody.partial();

router.get("/doctors", authenticate, async (req, res): Promise<void> => {
  const query = ListQuery.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const { page, limit, search, isActive } = query.data;
  const result = await service.listDoctors(page, limit, search, isActive);
  res.json(result);
});

router.post("/doctors", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const doctor = await service.createDoctor(parsed.data, req.session.userId!);
  if (!doctor) { res.status(500).json({ error: "فشل إنشاء الطبيب" }); return; }
  res.status(201).json(doctor);
});

router.get("/doctors/:id", authenticate, async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const doctor = await service.getDoctorById(params.data.id);
  if (!doctor) { res.status(404).json({ error: "الطبيب غير موجود" }); return; }
  res.json(doctor);
});

router.patch("/doctors/:id", authenticate, async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const doctor = await service.updateDoctor(params.data.id, parsed.data, req.session.userId!);
  if (!doctor) { res.status(404).json({ error: "الطبيب غير موجود" }); return; }
  res.json(doctor);
});

router.delete("/doctors/:id", authenticate, async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const deleted = await service.deleteDoctor(params.data.id, req.session.userId!);
  if (!deleted) { res.status(404).json({ error: "الطبيب غير موجود" }); return; }
  res.json({ success: true, message: "تم حذف الطبيب" });
});

export default router;
