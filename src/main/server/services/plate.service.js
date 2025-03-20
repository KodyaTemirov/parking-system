import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";
import { getCameraOperator } from "./camera.service.js";
import { getLastPaymentTime, getSessionByNumber, handleOutputSession } from "./sessions.service.js";
import { tarifs } from "@/utils/prices.js";
import axios from "axios";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    const isPayedToday = await isPayedToday(number);
    const lastPaymentTime = await getLastPaymentTime(number);

    if (isPayedToday) {
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
    console.log(error);
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

    const session = await getSessionByNumber(number);

    if (!session) return res.status(400).send({ message: "Session not found" });

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    // Проверяем, не оплатил ли он уже за этот период
    const isPayedToday = await isPayedToday(number);

    if (isPayedToday) {
      // Если уже оплатил - просто закрываем сессию
      handleOutputSession({
        number,
        plateImage,
        paymentMethod: 1, // По умолчанию наличные
        cameraIp: req.headers.host,
        fullImage,
        outputCost: 0,
      });
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
      // Если меньше 24 часов - просто закрываем сессию
      handleOutputSession({
        number,
        plateImage,
        paymentMethod,
        cameraIp: req.headers.host,
        fullImage,
        outputCost: 0,
      });
      // openFetch(true, cameraIp, camera.login, camera.password);
      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.log(error);
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

export { inputCar, outputCar, openFetch };
