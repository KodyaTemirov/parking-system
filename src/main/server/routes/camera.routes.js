import { Router } from "express";
import { DELETECAMERAS, GETCAMERAS, POSTCAMERAS, PUTCAMERAS } from "../services/camera.service.js";

const router = Router();

router.get("/camera", GETCAMERAS);

router.post("/camera", POSTCAMERAS);

router.put("/camera/:id", PUTCAMERAS);

router.delete("/camera/:id", DELETECAMERAS);

export default router;
