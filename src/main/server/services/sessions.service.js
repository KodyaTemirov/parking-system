import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";
import { openFetch } from "./plate.service.js";
import { getCameraOperator } from "./camera.service.js";
import { saveBase64Image, deleteImageFile } from "../../utils/saveBase64Image.js";
import { getSnapshot } from "../../utils/getSnapshot.js";
import { tarifs } from "../../utils/prices.js";
import { BrowserWindow } from "electron";
import fs from "fs";
const printReceipt = async (plateNumber, tariffType, startTime) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true, // Позволяет рендерить страницу без открытия окна
    },
  });

  const htmlContent = `
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          height: auto;
        }
        .receipt {
          width: 100%; /* Теперь чек занимает всю ширину */
          max-width: 70mm;
          text-align: center;
          padding: 5px;
          display: block;
          margin: 0 auto; /* Центрируем */
        }
        h2 { font-size: 14px; margin-bottom: 5px; }
        p { margin: 2px 0; font-size: 12px;  }
        hr { border: 1px dashed black; margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h2>КАССОВЫЙ ЧЕК</h2>
        <p><strong>Номер:</strong> ${plateNumber}</p>
        <p><strong>Тариф:</strong> ${tariffType}</p>
        <p><strong>Время начала:</strong> ${new Date(startTime).toLocaleString()}</p>
        <hr>
        <p>Спасибо за посещение!</p>
      </div>
    </body>
    </html>
  `;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  win.webContents.once("did-finish-load", async () => {
    console.log("HTML загружен, создаем PDF...");

    // Даем время на рендеринг перед печатью
    await win.webContents.executeJavaScript("document.body.offsetHeight");

    // Генерация PDF для отладки
    const pdfData = await win.webContents.printToPDF({
      marginsType: 0, // Без полей
      pageSize: { width: 58 * 2.83465, height: 100 }, // Динамическая высота
      printBackground: true,
      scaleFactor: 1, // Оригинальный масштаб
    });

    const pdfPath = "receipt_debug.pdf";
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    fs.writeFileSync(pdfPath, pdfData);

    // Получение списка принтеров
    const printers = await win.webContents.getPrintersAsync();
    console.log("Доступные принтеры:", printers);

    const defaultPrinter = printers.find((p) => p.isDefault);
    if (!defaultPrinter) {
      console.error("Не найден принтер по умолчанию");
      win.close();
      return;
    }

    console.log("Отправка на принтер:", defaultPrinter.name);

    // Ожидание рендеринга перед печатью
    setTimeout(() => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          deviceName: defaultPrinter.name,
          margins: { marginType: "custom", top: 1, bottom: 1, left: 1, right: 1 }, // Убираем поля
        },
        (success, errorType) => {
          if (!success) console.error("Ошибка печати:", errorType);
          win.close();
        }
      );
    }, 1000); // Даем 1 секунду на рендеринг перед печатью
  });
};
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
