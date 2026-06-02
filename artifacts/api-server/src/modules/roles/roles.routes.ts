import { Router, type IRouter } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { getAllRolesWithPermissions } from "./roles.repository";

const router: IRouter = Router();

router.get("/roles", authenticate, async (_req, res): Promise<void> => {
  const roles = await getAllRolesWithPermissions();
  res.json(roles);
});

export default router;
