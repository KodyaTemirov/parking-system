import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { openFetch } from "./plate.service.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image, deleteImageFile } from "../../utils/saveBase64Image.js";
import { getSnapshot } from "../../utils/getSnapshot.js";

const registerSession = async (req, res) => {
  const { number, plateImage, fullImage, eventName, tariffType, paymentMethod, cameraIp } =
    req.body;

  if (!number) {
    return await getSnapshotSession(eventName, tariffType, paymentMethod, cameraIp, res);
  }

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
  const { page = 1, size = 10, search } = req.query;
  const offset = (page - 1) * size;

  let query = "SELECT * FROM sessions";
  let countQuery = "SELECT COUNT(*) as total FROM sessions";
  let params = [];

  if (search) {
    query += " WHERE plateNumber LIKE ?";
    countQuery += " WHERE plateNumber LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY startTime DESC LIMIT ? OFFSET ?";
  params.push(Number(size), offset);

  const data = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...params.slice(0, -2));

  res.status(200).send({
    data,
    total: total.total,
    page: Number(page),
    size: Number(size),
    totalPages: Math.ceil(total.total / size),
  });
};

const getSnapshotSession = async (eventName, tariffType, paymentMethod, cameraIp, res) => {
  const camera = await getCameraOperator(cameraIp);
  const snapImage = await getSnapshot(cameraIp, camera.login, camera.password);
  const snapUrl = saveBase64Image(snapImage);

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod,cameraIp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    null,
    snapUrl || null,
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

  // openFetch(true, cameraIp, camera.login, camera.password);

  // setTimeout(() => {
  //   openFetch(false, cameraIp, camera.login, camera.password);
  // }, 100);

  res.status(201).send(insertedData);
};

const getSessionByNumber = (number) => {
  const data = db
    .prepare("SELECT * FROM sessions WHERE plateNumber = ? and paymentStatus = 0")
    .get(number);

  return data;
};

export { registerSession, getSessions, outputSession, getSessionByNumber };
