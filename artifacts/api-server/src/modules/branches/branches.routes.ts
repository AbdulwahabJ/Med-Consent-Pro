import { Router, type IRouter } from "express";
import * as service from "./branches.service";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { z } from "zod";

const router: IRouter = Router();

const IdParam = z.object({ id: z.coerce.number().int().positive() });
const CreateBody = z.object({ nameAr: z.string().min(1, "الاسم العربي مطلوب"), nameEn: z.string().optional(), address: z.string().optional(), isActive: z.boolean().optional() });
const UpdateBody = CreateBody.partial();
const ListQuery = z.object({ search: z.string().optional(), activeOnly: z.coerce.boolean().optional() });

router.get("/branches", authenticate, async (req, res): Promise<void> => {
  const query = ListQuery.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const items = await service.listBranches(query.data.search, query.data.activeOnly);
  res.json(items);
});

router.post("/branches", authenticate, authorize("manage_settings"), async (req, res): Promise<void> => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const item = await service.createBranch(parsed.data, req.session.userId!);
  res.status(201).json(item);
});

router.get("/branches/:id", authenticate, async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const item = await service.getBranchById(params.data.id);
  if (!item) { res.status(404).json({ error: "الفرع غير موجود" }); return; }
  res.json(item);
});

router.patch("/branches/:id", authenticate, authorize("manage_settings"), async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const item = await service.updateBranch(params.data.id, parsed.data, req.session.userId!);
  if (!item) { res.status(404).json({ error: "الفرع غير موجود" }); return; }
  res.json(item);
});

router.delete("/branches/:id", authenticate, authorize("manage_settings"), async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const deleted = await service.deleteBranch(params.data.id, req.session.userId!);
  if (!deleted) { res.status(404).json({ error: "الفرع غير موجود" }); return; }
  res.json({ success: true, message: "تم حذف الفرع" });
});

export default router;
