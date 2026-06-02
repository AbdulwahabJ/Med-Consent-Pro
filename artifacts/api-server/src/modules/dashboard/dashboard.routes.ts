import { Router, type IRouter } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { countActiveUsers, countTotalUsers } from "../users/users.repository";
import { getRecentAuditLogs } from "../audit/audit.repository";

const router: IRouter = Router();

router.get("/dashboard/summary", authenticate, async (_req, res): Promise<void> => {
  const [totalUsers, activeUsers, recentAuditLogs] = await Promise.all([
    countTotalUsers(),
    countActiveUsers(),
    getRecentAuditLogs(5),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    totalPatients: 0,
    completedFormsToday: 0,
    draftsCount: 0,
    sharedToday: 0,
    recentAuditLogs,
  });
});

export default router;
