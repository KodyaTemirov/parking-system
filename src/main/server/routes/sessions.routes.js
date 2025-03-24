import { Router } from "express";
import {
  getSessions,
  registerSession,
  getSessionsInfo,
  outputSession,
  closeSnapshotSession,
} from "../services/sessions.service.js";

const router = Router();

router.post("/register-session", registerSession);

router.post("/output-session", outputSession);

router.get("/session", getSessions);

router.get("/session/info", getSessionsInfo);

router.post("/session/snapshot", closeSnapshotSession);

export default router;
