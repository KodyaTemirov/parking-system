import { Router } from "express";
import {
  deleteCameras,
  getCameras,
  getOperatorCameras,
  postCameras,
  putCameras,
} from "../services/camera.service.js";

const router = Router();

router.get("/camera", getCameras);

router.get("/camera/operators/:id", getOperatorCameras);

router.post("/camera", postCameras);

router.put("/camera/:id", putCameras);

router.delete("/camera/:id", deleteCameras);

export default router;
