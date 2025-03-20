import { Router } from "express";
import { inputCar, outputCar } from "../services/plate.service.js";

const router = Router();

// router.post("/input", inputCar);

router.post("/output", outputCar);

export default router;
