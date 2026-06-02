import { Router, type IRouter } from "express";
import * as usersService from "./users.service";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import {
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  CreateUserBody,
  UpdateUserBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", authenticate, authorize("manage_users"), async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = query.data;
  const result = await usersService.listUsers(page, limit, search);
  res.json(result);
});

router.post("/users", authenticate, authorize("manage_users"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await usersService.createUser(
    {
      email: parsed.data.email,
      password: parsed.data.password,
      fullNameAr: parsed.data.fullNameAr,
      fullNameEn: parsed.data.fullNameEn,
      roleId: parsed.data.roleId,
      isActive: parsed.data.isActive,
    },
    req.session.userId!,
  );

  if (!user) {
    res.status(500).json({ error: "فشل إنشاء المستخدم" });
    return;
  }

  res.status(201).json(user);
});

router.get("/users/:id", authenticate, authorize("manage_users"), async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await usersService.getUserById(params.data.id);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json(user);
});

router.patch("/users/:id", authenticate, authorize("manage_users"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await usersService.updateUser(params.data.id, parsed.data, req.session.userId!);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json(user);
});

router.delete("/users/:id", authenticate, authorize("manage_users"), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (params.data.id === req.session.userId) {
    res.status(400).json({ error: "لا يمكن حذف حسابك الخاص" });
    return;
  }

  const deleted = await usersService.deleteUser(params.data.id, req.session.userId!);
  if (!deleted) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json({ success: true, message: "تم حذف المستخدم" });
});

export default router;
