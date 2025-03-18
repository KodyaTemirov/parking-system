import { Router } from "express";
import { DELETECAMERAS, GETCAMERAS, POSTCAMERAS, PUTCAMERAS } from "../services/camera.service.js";

const router = Router();

router.get("/operator", GETCAMERAS);

router.post("/operator", POSTCAMERAS);

router.put("/operator/:id", PUTCAMERAS);

router.delete("/operator/:id", DELETECAMERAS);

export default router;
