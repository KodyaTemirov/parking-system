import { Router } from "express";
import { getEnters, postEnter } from "../services/enter.service.js";

const router = Router();

router.get("/enter", getEnters);

router.post("/enter", postEnter);

export default router;
