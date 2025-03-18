import SessionRouter from "./sessions.routes.js";
import PlateRouter from "./plate.routes.js";
import CameraRouter from "./camera.routes.js";
import { Router } from "express";

const router = Router();

router.use(SessionRouter);
router.use(PlateRouter);
router.use(CameraRouter);

export default router;
