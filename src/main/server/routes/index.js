import SessionRouter from "./sessions.routes.js";
import PlateRouter from "./plate.routes.js";
import CameraRouter from "./camera.routes.js";
import OperatorRouter from "./operator.routes.js";
import EnterRouter from "./enter.routes.js";
import { Router } from "express";

const router = Router();

router.use(SessionRouter);
router.use(PlateRouter);
router.use(CameraRouter);
router.use(OperatorRouter);
router.use(EnterRouter);

export default router;
