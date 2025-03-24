import { Router } from "express";
import { inputCar, inputCarById, outputCar, outputCarById } from "../services/plate.service.js";

const router = Router();

router.post("/input", inputCar);

router.post("/output", outputCar);

router.post("/output/:id", outputCarById);

router.post("/input/:id", inputCarById);

export default router;
