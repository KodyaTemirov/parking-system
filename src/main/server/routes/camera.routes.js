import { Router } from "express";
import {
  DELETECAMERAS,
  GETCAMERAS,
  GETOPERATORCAMERAS,
  POSTCAMERAS,
  PUTCAMERAS,
} from "../services/camera.service.js";

const router = Router();

router.get("/camera", GETCAMERAS);

router.get("/camera/operators/:id", GETOPERATORCAMERAS);

router.post("/camera", POSTCAMERAS);

router.put("/camera/:id", PUTCAMERAS);

router.delete("/camera/:id", DELETECAMERAS);

export default router;
