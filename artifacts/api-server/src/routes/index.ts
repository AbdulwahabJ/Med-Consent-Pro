import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";
import usersRouter from "../modules/users/users.routes";
import rolesRouter from "../modules/roles/roles.routes";
import dashboardRouter from "../modules/dashboard/dashboard.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(rolesRouter);
router.use(dashboardRouter);

export default router;
