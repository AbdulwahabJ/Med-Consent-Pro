import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "../modules/auth/auth.routes";
import usersRouter from "../modules/users/users.routes";
import rolesRouter from "../modules/roles/roles.routes";
import dashboardRouter from "../modules/dashboard/dashboard.routes";
import specialtiesRouter from "../modules/specialties/specialties.routes";
import branchesRouter from "../modules/branches/branches.routes";
import patientsRouter from "../modules/patients/patients.routes";
import doctorsRouter from "../modules/doctors/doctors.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(rolesRouter);
router.use(dashboardRouter);
router.use(specialtiesRouter);
router.use(branchesRouter);
router.use(patientsRouter);
router.use(doctorsRouter);

export default router;
