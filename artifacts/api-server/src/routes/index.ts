import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

export default router;
