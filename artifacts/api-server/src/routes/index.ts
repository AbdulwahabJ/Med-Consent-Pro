import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";
import templatesRouter from "../modules/templates/templates.routes";
import fieldsRouter from "../modules/fields/fields.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(templatesRouter);
router.use(fieldsRouter);

export default router;
