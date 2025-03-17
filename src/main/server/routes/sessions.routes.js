import { Router } from "express";
import { getSessions, registerSession } from "../services/sessions.service.js";

const router = Router();

router.post("/register-session", registerSession);

router.get("/session", getSessions);

export default router;
