import db from "../db/database.js";
import { getCameraOperator } from "../server/services/camera.service";
import { checkInternetConnection } from "./checkInternet.js";
import { getSnapshot } from "./getSnapshot.js";
import { openFetch, openFetchByIp } from "./plateFunctions.js";
import { postInfo } from "./postInfo.js";
import { tariffs } from "@/config";
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
  try {
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

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(session.id);

    const camera = await getCameraOperator(cameraIp);

    insertedData.operatorId = camera.operatorId;
    await getIO().emit("newSession", insertedData);
  } catch (error) {
    throw error;
  }
};

const handleOutputSessionId = async ({
  id,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp,
}) => {
  try {
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
      id
    );

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await getIO().emit("newSession", insertedData);
  } catch (error) {
    console.log(error);
  }
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

const getSnapshotSession = async (eventName, tariffType, paymentMethod, cameraIp, res) => {
  const camera = await getCameraOperator(cameraIp);
  const snapImage = await getSnapshot(cameraIp, camera.login, camera.password);
  const snapUrl = saveBase64Image(snapImage);

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, inputFullImage, startTime, tariffType, duration, inputCost, inputPaymentMethod,cameraIp, lastActivity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
  `);

  const result = stmt.run(
    null,
    snapUrl || null,
    new Date().toISOString(),
    tariffType,
    null,
    tariffs.find((item) => item.id == tariffType).price,
    paymentMethod,
    cameraIp,
    new Date().toISOString()
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

  // await openFetchByIp(cameraIp);

  res.status(201).send(insertedData);
};

const getParkStats = async () => {
  try {
    const allData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
  `
      )
      .get();

    const outputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE endTime is not null
  `
      )
      .all();

    const inputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE endTime is null
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

    return {
      allData,
      inputData,
      outputData,
      totalCostToday: totalCostToday.totalInputCost + totalCostToday.totalOutputCost,
      totalCarInPark: inputData - outputData,
    };
  } catch (error) {
    throw error;
  }
};

const sendParkStats = async () => {
  try {
    const allData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
  `
      )
      .get();

    const outputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE endTime is not null
  `
      )
      .all();

    const inputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE endTime is null
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

    getIO().emit("parkStats", {
      allData,
      inputData,
      outputData,
      totalCostToday: totalCostToday.totalInputCost + totalCostToday.totalOutputCost,
      totalCarInPark: inputData - outputData,
    });
  } catch (error) {
    throw error;
  }
};

const deleteSession = (id) => {
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  stmt.run(id);
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
  getParkStats,
  sendParkStats,
  deleteSession,
};
