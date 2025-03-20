import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { openFetch } from "./plate.service.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image, deleteImageFile } from "../../utils/saveBase64Image.js";
import { getSnapshot } from "../../utils/getSnapshot.js";
import { tarifs } from "../../utils/prices.js";

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
      (plateNumber, inputPlateImage, inputFullImage, startTime, tariffType, duration, inputCost, inputPaymentMethod,cameraIp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    number,
    plateImageFile || null,
    fullImageFile || null,
    new Date().toISOString(),
    tariffType,
    null,
    tarifs.find((item) => item.id == tariffType).price,
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
  const { number, plateImage, fullImage, paymentMethod, outputCost, cameraIp } = req.body;

  const stmt = db.prepare(`
    UPDATE sessions
    SET outputPlateImage = ?,
        outputFullImage = ?,
        endTime = ?,
        duration = ?,
        outputCost = ?,
        outputPaymentMethod = ?,
        cameraIp = ?
    WHERE plateNumber = ? AND endTime IS NULL
  `);

  const result = stmt.run(
    number,
    plateImage || null,
    fullImage || null,
    new Date().toISOString(),
    null,
    outputCost,
    paymentMethod,
    cameraIp
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

const getSnapshotSession = async (tariffType, paymentMethod, cameraIp, res) => {
  const camera = await getCameraOperator(cameraIp);
  const snapImage = await getSnapshot(cameraIp, camera.login, camera.password);
  const snapUrl = saveBase64Image(snapImage);

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, inputFullImage, startTime, tariffType, duration, inputCost, inputPaymentMethod,cameraIp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    null,
    snapUrl || null,
    new Date().toISOString(),
    tariffType,
    null,
    tarifs.find((item) => item.id == tariffType).price,
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
    .prepare("SELECT * FROM sessions WHERE plateNumber = ? and endTime is null")
    .get(number);

  return data;
};

const getSessionsInfo = async (req, res) => {
  try {
    const allData = db
      .prepare(
        `
      SELECT
        COUNT(*) as count,
        tariffType
      FROM sessions
      GROUP BY tariffType
    `
      )
      .all();

    const outputData = db
      .prepare(
        `
      SELECT
        COUNT(*) as count,
        tariffType
      FROM sessions
      WHERE endTime is not null
      GROUP BY tariffType
    `
      )
      .all();

    const inputData = db
      .prepare(
        `
      SELECT
        COUNT(*) as count,
        tariffType
      FROM sessions
      WHERE endTime is null
      GROUP BY tariffType
    `
      )
      .all();

    const totalCostToday = db
      .prepare(
        `
      SELECT SUM(inputCost) as totalInputCost, SUM(outputCost) as totalOutputCost FROM sessions WHERE date(startTime) = date('now')
    `
      )
      .get();

    res.status(200).send({
      allData,
      inputData,
      outputData,
      totalCostToday: totalCostToday.totalInputCost + totalCostToday.totalOutputCost,
    });
  } catch (error) {
    res.status(400).send(error);
  }
};

export { registerSession, getSessions, outputSession, getSessionByNumber, getSessionsInfo };
