import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";
import { getCameraOperator } from "./camera.service.js";
import db from "@/db/database.js";
import { tarifs } from "@/utils/prices.js";
import axios from "axios";
import { saveBase64Image } from "../../utils/saveBase64Image.js";
import {
  getLastPaymentTime,
  getLastPaymentTimeId,
  getSessionById,
  getSessionByNumber,
  handleOutputSession,
  handleOutputSessionId,
  isPayedToday,
  isPayedTodayId,
} from "../../utils/sessionFunctions.js";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    const isPayedTodayValue = await isPayedTodayId(number);
    const lastPaymentTime = await getLastPaymentTime(number);

    if (isPayedTodayValue) {
      getIO().emit(`payedToday-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        lastPaymentTime,
        eventName: "input",
      });

      const camera = await getCameraOperator(req.headers.host);
      // openFetch(true, req.headers.host, camera.login, camera.password);

      // setTimeout(() => {
      //   openFetch(false, req.headers.host, camera.login, camera.password);
      // }, 100);

      res.status(200).send("Car already payed today");

      return;
    }

    getIO().emit(`inputCar-${operator.operatorId}`, {
      number,
      plateImage,
      fullImage,
      cameraIp: req.headers.host,
      operatorId: operator.operatorId,
      eventName: "input",
    });

    res.status(200).send("OK");
  } catch (error) {
    res.status(400).send(error);
  }
};

const outputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const session = await getSessionByNumber(number);

    const isPayedTodayValue = await isPayedToday(number);

    if (!session && !isPayedTodayValue) {
      const lastSession = db
        .prepare(
          `SELECT * FROM sessions
         WHERE plateNumber = ?
         ORDER BY startTime DESC
         LIMIT 1`
        )
        .get(number);

      let price = 0;
      if (lastSession) {
        const lastEntryTime = new Date(lastSession.startTime);
        const now = new Date();
        const hoursSinceEntry = (now - lastEntryTime) / (1000 * 60 * 60);
        price = Math.ceil((hoursSinceEntry - 24) / 24) * tarifs[0].price;

        return getIO().emit(`outputCar-${operator.operatorId}`, {
          number,
          plateImage,
          fullImage,
          price: price - lastSession.outputCost,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      } else {
        return getIO().emit(`outputCar-${operator.operatorId}`, {
          number,
          plateImage,
          fullImage,
          price: 100000,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      }
    }

    // Проверяем, не оплатил ли он уже за   этот период

    if (isPayedTodayValue) {
      const lastPaymentTime = await getLastPaymentTime(number);

      getIO().emit(`payedToday-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        lastPaymentTime,
        eventName: "output",
      });

      // openFetch(true, cameraIp, camera.login, camera.password);
      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);
      res.status(200).send("OK");
      return;
    }

    const price = calculatePrice(session.startTime, new Date().toISOString(), session.tariffType);

    // Если есть цена (простоял больше 24 часов)
    if (price > 0) {
      getIO().emit(`outputCar-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        price,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
      });
    } else {
      const lastPaymentTime = await getLastPaymentTime(number);

      const plateImageFile = saveBase64Image(plateImage);
      const fullImageFile = saveBase64Image(fullImage);

      // Если меньше 24 часов - просто закрываем сессию
      handleOutputSession({
        number,
        plateImageFile,
        paymentMethod: 1,
        cameraIp: req.headers.host,
        fullImageFile,
        outputCost: 0,
      });

      getIO().emit(`payedToday-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        lastPaymentTime,
        eventName: "output",
      });

      // openFetch(true, cameraIp, camera.login, camera.password);
      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);
    }

    res.status(200).send("OK");
  } catch (error) {
    res.status(400).send(error);
  }
};

const outputCarById = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { id } = parsePlateData(req.params);

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const snapImage = await getSnapshot(req.headers.host, operator.login, operator.password);
    const snapUrl = saveBase64Image(snapImage);

    const session = await getSessionById(id);

    const isPayedTodayValue = await isPayedTodayId(id);

    if (!session && !isPayedTodayValue) {
      const lastSession = db
        .prepare(
          `SELECT * FROM sessions
         WHERE id = ?
         ORDER BY startTime DESC
         LIMIT 1`
        )
        .get(id);

      let price = 0;
      if (lastSession) {
        const lastEntryTime = new Date(lastSession.startTime);
        const now = new Date();
        const hoursSinceEntry = (now - lastEntryTime) / (1000 * 60 * 60);
        price = Math.ceil((hoursSinceEntry - 24) / 24) * tarifs[0].price;

        return getIO().emit(`outputCar-${operator.operatorId}`, {
          number: null,
          plateImage: null,
          fullImage: snapImage,
          price: price - lastSession.outputCost,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      } else {
        return getIO().emit(`outputCar-${operator.operatorId}`, {
          number: null,
          plateImage: null,
          fullImage: snapImage,
          price: 100000,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      }
    }

    // Проверяем, не оплатил ли он уже за   этот период

    if (isPayedTodayValue) {
      const lastPaymentTime = await getLastPaymentTimeId(id);

      getIO().emit(`payedToday-${operator.operatorId}`, {
        number: null,
        plateImage: null,
        fullImage: snapImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        lastPaymentTime,
        eventName: "output",
      });

      // openFetch(true, cameraIp, camera.login, camera.password);
      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);
      res.status(200).send("OK");
      return;
    }

    const price = calculatePrice(session.startTime, new Date().toISOString(), session.tariffType);

    // Если есть цена (простоял больше 24 часов)
    if (price > 0) {
      getIO().emit(`outputCar-${operator.operatorId}`, {
        number: null,
        plateImage: null,
        fullImage: snapImage,
        price,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
      });
    } else {
      const lastPaymentTime = await getLastPaymentTimeId(id);

      // Если меньше 24 часов - просто закрываем сессию
      handleOutputSessionId({
        id,
        plateImageFile: null,
        paymentMethod: 1,
        cameraIp: req.headers.host,
        fullImageFile: snapUrl,
        outputCost: 0,
      });

      getIO().emit(`payedToday-${operator.operatorId}`, {
        number: null,
        plateImage: null,
        fullImage: snapImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        lastPaymentTime,
        eventName: "output",
      });

      // openFetch(true, cameraIp, camera.login, camera.password);
      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);
    }

    res.status(200).send("OK");
  } catch (error) {
    res.status(400).send(error);
  }
};

const calculatePrice = (startTime, endTime, tariffType) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const tarifCost = tarifs.find((tarif) => tarif.id === tariffType).price;

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

    const response = await axios.post(`https://${ip}/ManualAlarmOut/1`, raw, config);
    console.log(response.data);
  } catch (error) {
    console.error("Ошибка запроса:", error.message);
    if (error.response) {
      console.error("Статус:", error.response.status);
      console.error("Ответ:", error.response.data);
    }
  }
};

export { inputCar, outputCar, openFetch, calculatePrice, outputCarById };
