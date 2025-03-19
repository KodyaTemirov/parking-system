import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { openFetch } from "./plate.service.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image, deleteImageFile } from "../../utils/saveBase64Image.js";

const registerSession = async (req, res) => {
  const { number, plateImage, fullImage, eventName, tariffType, paymentMethod, cameraIp } =
    req.body;

  const plateImageFile = saveBase64Image(plateImage);
  const fullImageFile = saveBase64Image(fullImage);

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, plateImage, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod,cameraIp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    number,
    plateImageFile || null,
    fullImageFile || null,
    new Date().toISOString(),
    null,
    eventName,
    tariffType,
    null,
    null,
    paymentMethod,
    cameraIp
  );

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  await getIO().emit("newSession", insertedData);

  const camera = await getCameraOperator(cameraIp);
  // openFetch(true, cameraIp, camera.login, camera.password);

  // setTimeout(() => {
  //   openFetch(false, cameraIp, camera.login, camera.password);
  // }, 100);

  res.status(201).send(insertedData);
};

const outputSession = async (req, res) => {
  const { number, plateImage, fullImage, eventName, tariffType, paymentMethod } = req.body;

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, plateImage, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    number,
    plateImage || null,
    fullImage || null,
    new Date().toISOString(),
    null,
    eventName,
    tariffType,
    null,
    null,
    paymentMethod
  );

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  await getIO().emit("newSession", insertedData);

  res.status(201).send(insertedData);
};

const getSessions = (req, res) => {
  const data = db.prepare("SELECT * FROM sessions ORDER BY startTime DESC").all();

  res.status(200).send(data);
};

const getSessionByNumber = (number) => {
  const data = db
    .prepare("SELECT * FROM sessions WHERE plateNumber = ? and paymentStatus = 0")
    .get(number);

  return data;
};

export { registerSession, getSessions, outputSession, getSessionByNumber };
