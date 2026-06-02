import { Router, type IRouter } from "express";
import * as authService from "./auth.service";
import { authenticate } from "../../middlewares/authenticate";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "محاولات كثيرة، يرجى الانتظار قليلاً" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }

  const result = await authService.loginUser(email, password, req);

  if (!result.success || !result.user) {
    res.status(401).json({ error: result.error ?? "بيانات الدخول غير صحيحة" });
    return;
  }

  req.session.userId = result.user.id;
  req.session.roleId = result.user.roleId;
  req.session.roleName = result.user.roleName;
  req.session.permissions = result.user.permissions;

  res.json(authService.formatAuthUser(result.user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Session destroy error");
    }
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
