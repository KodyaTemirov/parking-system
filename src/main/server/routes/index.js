import SessionRouter from "./sessions.routes.js";
import PlateRouter from "./plate.routes.js";
import { Router } from "express";

const router = Router();

router.use(SessionRouter);
router.use(PlateRouter);

export default router;
