import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image } from "../../utils/saveBase64Image.js";
import { getSnapshot } from "../../utils/getSnapshot.js";
import { tarifs } from "../../utils/prices.js";
import { postInfo } from "../../utils/postInfo.js";
import { checkInternetConnection } from "../../utils/checkInternet.js";
import { getSnapshotSession, getParkStats, sendParkStats } from "../../utils/sessionFunctions.js";
import { openFetch } from "../../utils/plateFunctions.js";

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
  await sendParkStats();

  // openFetch(true, cameraIp, camera.login, camera.password);

  // setTimeout(() => {
  //   openFetch(false, cameraIp, camera.login, camera.password);
  // }, 100);

  // await printReceipt(number, tariffType, insertedData.startTime);

  if (checkInternetConnection()) {
    insertedData.event = "input";
    await postInfo({
      type: "insert",
      data: insertedData,
      event: "input",
    });
  }

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

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(lastSession.id);

    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await getIO().emit("newSession", insertedData);
    await sendParkStats();

    if (checkInternetConnection()) {
      insertedData.event = "output";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "output",
      });
    }

    res.status(201).send(insertedData);
  } else {
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
            cameraIp = ?,
            isUpdated = 1
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
        .get(lastPaidSession.id);

      const camera = await getCameraOperator(cameraIp);
      insertedData.operatorId = camera.operatorId;

      await getIO().emit("newSession", insertedData);
      await sendParkStats();

      if (checkInternetConnection()) {
        insertedData.event = "output";
        await postInfo({
          type: "insert",
          data: insertedData,
          event: "output",
        });
      }

      res.status(201).send(insertedData);
    }
  }
};

const closeSnapshotSession = async (req, res) => {
  const { id, plateImage, fullImage, paymentMethod, outputCost, cameraIp } = req.body;

  const lastSession = db
    .prepare(
      `
    SELECT * FROM sessions
    WHERE id = ? AND endTime IS NULL
    ORDER BY startTime DESC
    LIMIT 1
  `
    )
    .get(id);

  if (lastSession) {
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
      WHERE id = ? AND endTime IS NULL
    `);

    const result = stmt.run(
      null,
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
    await sendParkStats();

    if (checkInternetConnection()) {
      insertedData.event = "output";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "output",
      });
    }

    res.status(201).send(insertedData);
  } else {
    const lastPaidSession = db
      .prepare(
        `
    SELECT * FROM sessions
    WHERE id = ? AND endTime IS NOT NULL
    ORDER BY startTime DESC
    LIMIT 1
  `
      )
      .get(id);

    if (lastPaidSession) {
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
        WHERE id = ? AND endTime IS NOT NULL
      `);

      const result = stmt.run(
        null,
        fullImage || null,
        new Date().toISOString(),
        null,
        lastPaidSession.outputCost + outputCost,
        paymentMethod,
        cameraIp,
        id
      );

      const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);

      const camera = await getCameraOperator(cameraIp);
      insertedData.operatorId = camera.operatorId;

      await getIO().emit("newSession", insertedData);
      await sendParkStats();

      if (checkInternetConnection()) {
        insertedData.event = "output";
        await postInfo({
          type: "insert",
          data: insertedData,
          event: "output",
        });
      }

      res.status(201).send(insertedData);
    }
  }
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

const getSessionsInfo = async (req, res) => {
  try {
    const data = await getParkStats();
    res.status(200).send(data);
  } catch (error) {
    res.status(400).send(error);
  }
};

export { registerSession, getSessions, outputSession, getSessionsInfo, closeSnapshotSession };
