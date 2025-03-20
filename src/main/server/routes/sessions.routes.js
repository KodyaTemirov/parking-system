import { Router } from "express";
import { getSessions, registerSession, getSessionsInfo } from "../services/sessions.service.js";

const router = Router();

router.post("/register-session", registerSession);

router.get("/session", getSessions);

router.get("/session/info", getSessionsInfo);

export default router;
