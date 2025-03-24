import { Router } from "express";
import { inputCar, outputCar, outputCarById } from "../services/plate.service.js";

const router = Router();

router.post("/input", inputCar);

router.post("/output", outputCar);

router.post("/output/:id", outputCarById);

export default router;
