import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";
import templatesRouter from "../modules/templates/templates.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(templatesRouter);

export default router;
