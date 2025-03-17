import { Router } from "express";
import { parsePlateData } from "@/utils/parsePlateData.js";
import db from "@/db/database.js";
import { Builder } from "xml2js";
import fs from "fs";

const router = Router();

const handleCarData = (mainWindow, eventName) => async (req, res, next) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    mainWindow.webContents.send(eventName, { number, plateImage, fullImage });

    res.status(200).send("OK");
  } catch (error) {
    console.error(`❌ Error processing ${eventName}:`, error);
    next(error);
  }
};

const plateRoutes = (mainWindow) => {
  router.post("/input", handleCarData(mainWindow, "inputCar"));
  router.post("/output", handleCarData(mainWindow, "outputCar"));

  return router;
};

// Закрываем соединение с базой при завершении процесса
process.on("exit", () => {
  console.log("💾 Closing database connection...");
  db.close();
});

export default plateRoutes;
