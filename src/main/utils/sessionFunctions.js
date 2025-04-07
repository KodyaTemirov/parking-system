import db from "../db/database.js";
import { getCameraOperator } from "../server/services/camera.service";
import { checkInternetConnection } from "./checkInternet.js";
import { getSnapshot } from "./getSnapshot.js";
import { openFetch, openFetchByIp } from "./plateFunctions.js";
import { postInfo } from "./postInfo.js";
import { tariffs } from "@/config";
import { deleteImageFile, saveBase64Image } from "./saveBase64Image.js";
import { getIO } from "./socket.js";
import generateOfd from "./generateOfd.js";

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
      .prepare(`SELECT * FROM sessions WHERE plateNumber = ? order by id desc limit 1`)
      .get(number);

    if (session.outputPlateImage) {
      deleteImageFile(session.outputPlateImage);
    }

    if (session.outputFullImage) {
      deleteImageFile(session.outputFullImage);
    }

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
    await getIO().emit("newUpdate", insertedData);
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
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);

    if (session.outputPlateImage) {
      deleteImageFile(session.outputPlateImage);
    }

    if (session.outputFullImage) {
      deleteImageFile(session.outputFullImage);
    }

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

    await getIO().emit("newUpdate", insertedData);
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

  if (await checkInternetConnection()) {
    const url = await generateOfd(
      result.lastInsertRowid,
      tariffs.find((item) => item.id == tariffType).price
    );

    db.prepare(
      `
      UPDATE sessions
      SET ofd = ?
      WHERE id = ?
    `
    ).run(url, result.lastInsertRowid);
  }

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);

  insertedData.operatorId = camera.operatorId;

  if (await checkInternetConnection()) {
    insertedData.event = "input";
    await postInfo({
      type: "insert",
      data: insertedData,
      event: "input",
    });
  }

  await getIO().emit("newSession", insertedData);
  await sendParkStats();

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

    const innerCars = db
      .prepare(
        `
  SELECT
    COUNT(*) as count
  FROM sessions
  WHERE isInner = 1
`
      )
      .get();

    const outputData = db
      .prepare(
        `
  SELECT
    COUNT(*) as count
  FROM sessions
  WHERE isInner = 0
`
      )
      .get();

    const inputData = db
      .prepare(
        `
  SELECT
    COUNT(*) as count
  FROM sessions
  WHERE endTime is null
`
      )
      .get();

    const totalCostToday = db
      .prepare(
        `
  SELECT SUM(inputCost) as totalInputCost, SUM(outputCost) as totalOutputCost FROM sessions
`
      )
      .get();

    return {
      allData: allData.count,
      inputData: inputData.count,
      outputData: outputData.count,
      totalCostToday: totalCostToday.totalInputCost + totalCostToday.totalOutputCost,
      totalCarInPark: innerCars.count,
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

    const innerCars = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE isInner = 1
  `
      )
      .get();

    const outputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE isInner = 0
  `
      )
      .get();

    const inputData = db
      .prepare(
        `
    SELECT
      COUNT(*) as count
    FROM sessions
    WHERE endTime is null
  `
      )
      .get();

    const totalCostToday = db
      .prepare(
        `
    SELECT SUM(inputCost) as totalInputCost, SUM(outputCost) as totalOutputCost FROM sessions
  `
      )
      .get();

    getIO().emit("parkStats", {
      allData: allData.count,
      inputData: inputData.count,
      outputData: outputData.count,
      totalCostToday: totalCostToday.totalInputCost + totalCostToday.totalOutputCost,
      totalCarInPark: innerCars.count,
    });
  } catch (error) {
    throw error;
  }
};

const deleteSession = (id) => {
  const stmt = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  stmt.run(id);
};

const sendSessions = async () => {
  try {
    if (!(await checkInternetConnection())) return;
    console.log("CRON STARTED ===================================");

    const stmt = db.prepare("SELECT * FROM sessions where isUpdated = 1 or isSync = 0");
    const sessions = stmt.all();
    for (const item of sessions) {
      if (item.inputPlateImage != null && item.inputFullImage != null) {
        const image = getImageFile(item.inputPlateImage);
        const imageFull = getImageFile(item.inputFullImage);

        const plateImageId = await uploadImage(image);
        const fullImageId = await uploadImage(imageFull);

        item.inputPlateImage = plateImageId;
        item.inputFullImage = fullImageId;
      }
      if (item.outputPlateImage != null && item.outputFullImage != null) {
        const image = getImageFile(item.outputPlateImage);
        const imageFull = getImageFile(item.outputFullImage);

        const plateImageId = await uploadImage(image);
        const fullImageId = await uploadImage(imageFull);

        item.outputPlateImage = plateImageId;
        item.outputFullImage = fullImageId;
      }
    }

    axios.post(
      `https://raqamli-bozor.uz/services/platon-core/api/v2/desktop/market/vehicles`,
      {
        data: sessions,
      },
      {
        headers: {
          token: "68fa03a7-ff2f-cfdf-bbe7-c4e42e93a13e",
        },
      }
    );

    const sessionIds = sessions.map((session) => session.id);
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => "?").join(",");
      db.prepare(`UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (${placeholders})`).run(
        ...sessionIds
      );
    }
  } catch (error) {
    console.log(error);
  }
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
  sendSessions,
};
