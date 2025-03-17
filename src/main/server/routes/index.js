import SessionRouter from "./sessionsRoutes.js";
import { Router } from "express";

const router = Router();

router.use(SessionRouter);

export default router;
