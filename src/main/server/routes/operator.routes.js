import { Router } from "express";
import {
  DELETEOPERATORS,
  GETOPERATORS,
  POSTOPERATORS,
  PUTOPERATORS,
} from "../services/operator.service.js";

const router = Router();

router.get("/operator", GETOPERATORS);

router.post("/operator", POSTOPERATORS);

router.put("/operator/:id", PUTOPERATORS);

router.delete("/operator/:id", DELETEOPERATORS);

export default router;
