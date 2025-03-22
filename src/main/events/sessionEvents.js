import { ipcMain, BrowserWindow, app } from "electron";
import axios from "axios";

import fs from "fs/promises";
import db from "@/db/database.js";
const config = {
  headers: {
    "Content-Type": "application/xml",
    Authorization: "Basic YWRtaW46MTIzNDU2",
    Cookie: "Secure; Secure",
  },
  httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }), // Игнорируем самоподписанный сертификат
};

const openFetch = async (status) => {
  try {
    const raw = `<?xml version="1.0" encoding="UTF-8"?>
<config version="1.0" xmlns="http://www.ipc.com/ver10">
  <action>
    <status>${status}</status>
  </action>
</config>`;

    const response = await axios.post("https://10.20.10.131/ManualAlarmOut/1", raw, config);
    console.log(response.data);
  } catch (error) {
    console.error("Ошибка запроса:", error.message);
    if (error.response) {
      console.error("Статус:", error.response.status);
      console.error("Ответ:", error.response.data);
    }
  }
};

export function registerSessionEvents() {
  ipcMain.on(
    "new-session",
    (event, { number, plateImage, fullImage, eventName, tariffType, paymentMethod }) => {
      const stmt = db.prepare(`
  INSERT INTO sessions
    (plateNumber, plateImage, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

      const result = stmt.run(
        number,
        plateImage || null,
        fullImage || null,
        new Date().toISOString(), // Текущее время для startTime
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

      event.reply("new-session", insertedData);

      // openFetch("true");
      // setTimeout(() => {
      //   openFetch("false");
      // }, 100);
    }
  );

  ipcMain.on("getSessions", (event) => {
    const data = db.prepare("SELECT * FROM sessions ORDER BY startTime DESC").all();

    event.reply("getSessions", data);
  });
}

// export function registerSessionEvents() {
//   ipcMain.on(
//     "new-session",
//     (event, { number, plateImage, fullImage, eventName, tariffType, paymentMethod }) => {
//       const stmt = db.prepare(`
//   INSERT INTO sessions
//     (plateNumber, plateImage, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod)
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// `);

//       const result = stmt.run(
//         number,
//         plateImage || null,
//         fullImage || null,
//         new Date().toISOString(), // Текущее время для startTime
//         null,
//         eventName,
//         tariffType,
//         null,
//         null,
//         paymentMethod
//       );

//       const insertedData = db
//         .prepare("SELECT * FROM sessions WHERE id = ?")
//         .get(result.lastInsertRowid);

//       event.reply("new-session", insertedData);

//       // openFetch("true");
//       // setTimeout(() => {
//       //   openFetch("false");
//       // }, 100);
//     }
//   );

//   ipcMain.on("getSessions", (event) => {
//     const data = db.prepare("SELECT * FROM sessions ORDER BY startTime DESC").all();

//     event.reply("getSessions", data);
//   });
// }
