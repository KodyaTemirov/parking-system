import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { openFetch } from "./plate.service.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image, deleteImageFile } from "../../utils/saveBase64Image.js";
import { getSnapshot } from "../../utils/getSnapshot.js";
import { tarifs } from "../../utils/prices.js";
import { postInfo } from "../../utils/postInfo.js";

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
  const camera = await getCameraOperator(cameraIp);
  insertedData.operatorId = camera.operatorId;

  await getIO().emit("newSession", insertedData);

  // openFetch(true, cameraIp, camera.login, camera.password);

  // setTimeout(() => {
  //   openFetch(false, cameraIp, camera.login, camera.password);
  // }, 100);

  // await printReceipt(number, tariffType, insertedData.startTime);

  await postInfo({
    type: "insert",
    data: insertedData,
  });

  res.status(201).send(insertedData);
};

const outputSession = async (req, res) => {
  const { number, plateImage, fullImage, paymentMethod, outputCost, cameraIp } = req.body;

  const lastSession = db
    .prepare(
      `
    SELECT * FROM sessions
    WHERE plateNumber = ? AND endTime IS NULL
    ORDER BY startTime DESC
    LIMIT 1
  `
    )
    .get(number);

  if (lastSession) {
    console.log(lastSession, "lastSession1111");
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
      plateImage || null,
      fullImage || null,
      new Date().toISOString(),
      null,
      outputCost,
      paymentMethod,
      cameraIp,
      number
    );

    const insertedData = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(result.lastInsertRowid);

    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await getIO().emit("newSession", insertedData);

    res.status(201).send(insertedData);
  } else {
    console.log(lastSession, "lastSession2222");

    const lastPaidSession = db
      .prepare(
        `
    SELECT * FROM sessions
    WHERE plateNumber = ? AND endTime IS NOT NULL
    ORDER BY startTime DESC
    LIMIT 1
  `
      )
      .get(number);

    if (lastPaidSession) {
      const stmt = db.prepare(`
        UPDATE sessions
        SET outputPlateImage = ?,
            outputFullImage = ?,
            endTime = ?,
            duration = ?,
            outputCost = ?,
            outputPaymentMethod = ?,
            cameraIp = ?
        WHERE plateNumber = ? AND endTime IS NOT NULL
      `);

      const result = stmt.run(
        plateImage || null,
        fullImage || null,
        new Date().toISOString(),
        null,
        lastPaidSession.outputCost + outputCost,
        paymentMethod,
        cameraIp,
        number
      );

      const insertedData = db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .get(result.lastInsertRowid);

      const camera = await getCameraOperator(cameraIp);
      insertedData.operatorId = camera.operatorId;

      await getIO().emit("newSession", insertedData);

      res.status(201).send(insertedData);
    }
  }
};

const handleOutputSession = async ({
  number,
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
    WHERE plateNumber = ? AND endTime IS NULL
  `);

  const result = stmt.run(
    plateImage || null,
    fullImage || null,
    new Date().toISOString(),
    null,
    outputCost,
    paymentMethod,
    cameraIp,
    number
  );

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  const camera = await getCameraOperator(cameraIp);
  insertedData.operatorId = camera.operatorId;

  await getIO().emit("newSession", insertedData);
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

  insertedData.operatorId = camera.operatorId;

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

  console.log(paidDays, "paidDays", hoursSincePayment);

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

export {
  registerSession,
  getSessions,
  outputSession,
  getSessionByNumber,
  getSessionsInfo,
  handleOutputSession,
  isPayedToday,
  getLastPaymentTime,
};
