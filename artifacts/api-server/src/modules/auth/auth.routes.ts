import { Router, type IRouter } from "express";
import { z } from "zod";
import * as authService from "./auth.service";
import { authenticate } from "../../middlewares/authenticate";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "محاولات كثيرة، يرجى الانتظار قليلاً" },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }

  const { email, password } = parsed.data;
  const result = await authService.loginUser(email, password);

  if (!result.success || !result.user) {
    res.status(401).json({ error: result.error ?? "بيانات الدخول غير صحيحة" });
    return;
  }

  req.session.userId = result.user.id;
  res.json(authService.formatAuthUser(result.user));
});

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "يرجى التحقق من البيانات المدخلة" });
    return;
  }

  const { name, email, password } = parsed.data;
  const result = await authService.registerUser(name, email, password);

  if (!result.success || !result.user) {
    const status = result.error?.includes("مستخدم بالفعل") ? 409 : 400;
    res.status(status).json({ error: result.error ?? "فشل إنشاء الحساب" });
    return;
  }

  req.session.userId = result.user.id;
  res.status(201).json(authService.formatAuthUser(result.user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) req.log.error({ err }, "Session destroy error");
  });
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const user = await authService.getUserFromSession(req.session.userId!);
  if (!user) {
    res.status(401).json({ error: "الجلسة منتهية" });
    return;
  }
  res.json(authService.formatAuthUser(user));
});

export default router;
