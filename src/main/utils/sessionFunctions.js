import db from "../db/database.js";
import { getCameraOperator } from "../server/services/camera.service";
import { getSnapshot } from "./getSnapshot.js";
import { openFetch } from "./plateFunctions.js";
import { postInfo } from "./postInfo.js";
import { tarifs } from "./prices.js";
import { saveBase64Image } from "./saveBase64Image.js";
import { getIO } from "./socket.js";

const getSessionByNumber = (number) => {
  const data = db
    .prepare("SELECT * FROM sessions WHERE plateNumber = ? and endTime is null")
    .get(number);

  return data;
};

const handleOutputSession = async ({
  number,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp,
}) => {
  console.log(number);

  const session = db
    .prepare(`SELECT MAX(id) as id FROM sessions WHERE plateNumber = ?`)
    .get(number);

  const stmt = db.prepare(`
    UPDATE sessions
    SET outputPlateImage = ?,
        outputFullImage = ?,
        endTime = ?,
        duration = ?,
        outputCost = ?,
        outputPaymentMethod = ?,
        cameraIp = ?,
        isUpdated = 1
    WHERE id = ?
  `);

  const result = stmt.run(
    plateImage || null,
    fullImage || null,
    new Date().toISOString(),
    null,
    outputCost,
    paymentMethod,
    cameraIp,
    session.id
  );

  console.log(result, "result");
  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  const camera = await getCameraOperator(cameraIp);

  console.log(camera, "innerCamera", insertedData);
  insertedData.operatorId = camera.operatorId;

  await getIO().emit("newSession", insertedData);
};

const handleOutputSessionId = async ({
  id,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp,
}) => {
  const stmt = db.prepare(`
    UPDATE sessions
    SET outputPlateImage = ?,
        outputFullImage = ?,
        endTime = ?,
        duration = ?,
        outputCost = ?,
        outputPaymentMethod = ?,
        cameraIp = ?
    WHERE id = ? AND endTime IS NULL
  `);

  const result = stmt.run(
    plateImage || null,
    fullImage || null,
    new Date().toISOString(),
    null,
    outputCost,
    paymentMethod,
    cameraIp,
    id
  );

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  const camera = await getCameraOperator(cameraIp);
  insertedData.operatorId = camera.operatorId;

  await getIO().emit("newSession", insertedData);
};

const isPayedToday = (number) => {
  const data = db
    .prepare(
      `SELECT * FROM sessions
       WHERE plateNumber = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
    )
    .get(number);

  if (!data) return false;

  const lastPaymentTime = new Date(data.startTime);
  const now = new Date();
  const hoursSincePayment = (now - lastPaymentTime) / (1000 * 60 * 60);

  const paidDays = Math.floor(data.outputCost / data.inputCost) + 1 || 1;
  // Проверяем, не превысили ли мы оплаченный период

  return hoursSincePayment <= paidDays * 24;
};

const isPayedTodayId = (id) => {
  const data = db
    .prepare(
      `SELECT * FROM sessions
       WHERE id = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
    )
    .get(id);

  if (!data) return false;

  const lastPaymentTime = new Date(data.startTime);
  const now = new Date();
  const hoursSincePayment = (now - lastPaymentTime) / (1000 * 60 * 60);

  const paidDays = Math.floor(data.outputCost / data.inputCost) + 1 || 1;
  // Проверяем, не превысили ли мы оплаченный период

  return hoursSincePayment <= paidDays * 24;
};

const getLastPaymentTime = (number) => {
  const data = db
    .prepare(
      `SELECT startTime, outputCost, inputCost FROM sessions
       WHERE plateNumber = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
    )
    .get(number);

  if (!data) return null;

  // Возвращаем время последней оплаты и количество оплаченных дней
  return {
    startTime: data.startTime,
    paidDays: Math.floor(data.outputCost / data.inputCost),
  };
};

const getLastPaymentTimeId = (id) => {
  const data = db
    .prepare(
      `SELECT startTime, outputCost, inputCost FROM sessions
       WHERE id = ?
       AND endTime IS NOT NULL
       ORDER BY startTime DESC
       LIMIT 1`
    )
    .get(id);

  if (!data) return null;

  // Возвращаем время последней оплаты и количество оплаченных дней
  return {
    startTime: data.startTime,
    paidDays: Math.floor(data.outputCost / data.inputCost),
  };
};

const getSessionById = (id) => {
  const data = db.prepare("SELECT * FROM sessions WHERE id = ? and endTime is null").get(id);

  return data;
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

  insertedData.operatorId = camera.operatorId;

  if (checkInternetConnection()) {
    insertedData.event = "input";
    await postInfo({
      type: "insert",
      data: insertedData,
      event: "input",
    });
  }

  await getIO().emit("newSession", insertedData);

  // openFetch(true, cameraIp, camera.login, camera.password);

  // setTimeout(() => {
  //   openFetch(false, cameraIp, camera.login, camera.password);
  // }, 100);

  res.status(201).send(insertedData);
};

export {
  getSessionByNumber,
  handleOutputSession,
  handleOutputSessionId,
  isPayedToday,
  isPayedTodayId,
  getLastPaymentTime,
  getLastPaymentTimeId,
  getSessionById,
  getSnapshotSession,
};
