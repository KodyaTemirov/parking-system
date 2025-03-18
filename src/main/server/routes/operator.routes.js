import { Router } from "express";
import {
  deleteOperators,
  getOperators,
  postOperators,
  putOperators,
} from "../services/operator.service.js";

const router = Router();

router.get("/operator", getOperators);

router.post("/operator", postOperators);

router.put("/operator/:id", putOperators);

router.delete("/operator/:id", deleteOperators);

export default router;
