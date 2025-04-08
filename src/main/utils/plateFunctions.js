import axios from "axios";
import { tariffs } from "@/config";
import { getCameraOperator } from "../server/services/camera.service";
import db from "../db/database.js";

const calculatePrice = (startTime, endTime, tariffType) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const tarifCost = tariffs.find((tarif) => tarif.id === tariffType).pricePerDay;

  if (end < start) return 0;

  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));

  if (hours < 24) {
    return 0;
  }

  const days = Math.floor(hours / 24);
  return days * tarifCost;
};

const openFetch = async (status, ip, login, password) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/xml",
        Authorization: "Basic " + btoa(`${login}:${password}`),
        Cookie: "Secure; Secure",
      },
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
    };

    const raw = `<?xml version="1.0" encoding="UTF-8"?>
<config version="1.0" xmlns="http://www.ipc.com/ver10">
  <action>
    <status>${status}</status>
  </action>
</config>`;

    const response = await axios.post(`http://${ip}/ManualAlarmOut/1`, raw, config);
    console.log(response.data);
  } catch (error) {
    console.error("Ошибка запроса:", error.message);
    if (error.response) {
      console.error("Статус:", error.response.status);
      console.error("Ответ:", error.response.data);
    }
  }
};

const openFetchByIp = async (ip) => {
  const camera = await getCameraOperator(ip);

  openFetch(true, ip, camera.login, camera.password);

  setTimeout(() => {
    openFetch(false, ip, camera.login, camera.password);
  }, 100);
};

const setInner = async (item, value, type = "number") => {
  try {
    const stmt = db.prepare(
      `UPDATE sessions set isInner = ?, lastActivity = ? WHERE ${type == "number" ? "plateNumber" : "id"} = ?`
    );

    stmt.run(value, new Date().toISOString(), item);
  } catch (error) {
    console.error("Ошибка запроса:", error.message);
  }
};

const isEnoughTime = async (item, type) => {
  try {
    const session = db
      .prepare(`SELECT * FROM sessions WHERE ${type == "number" ? "plateNumber" : "id"} = ?`)
      .get(item);

    if (session) {
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      const timeDiff = now - lastActivity;
      if (timeDiff > 5000) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const isInner = async (item, type) => {
  try {
    const session = db
      .prepare(
        `SELECT * FROM sessions WHERE ${type == "number" ? "plateNumber" : "id"} = ? AND isInner = 1`
      )
      .get(item);

    if (session) {
      return session;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export { calculatePrice, openFetch, openFetchByIp, setInner, isEnoughTime, isInner };
