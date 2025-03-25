import { Router } from "express";
import { inputCar, inputCarById, outputCar, outputCarById } from "../services/plate.service.js";

const router = Router();

router.post("/input", inputCar);

router.post("/output", outputCar);

router.get("/output/:id", outputCarById);

router.get("/input/:id", inputCarById);

export default router;
