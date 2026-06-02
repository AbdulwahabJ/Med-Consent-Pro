import { Router, type IRouter } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { countActiveUsers } from "../users/users.repository";
import { getRecentAuditLogs } from "../audit/audit.repository";
import { countDoctors } from "../doctors/doctors.repository";

const router: IRouter = Router();

router.get("/dashboard/summary", authenticate, async (_req, res): Promise<void> => {
  const [totalDoctors, activeUsers, recentAuditLogs] = await Promise.all([
    countDoctors(),
    countActiveUsers(),
    getRecentAuditLogs(5),
  ]);

  res.json({
    totalDoctors,
    totalTemplates: 0,
    consentsTodayCount: 0,
    activeUsers,
    recentAuditLogs,
  });
});

export default router;
