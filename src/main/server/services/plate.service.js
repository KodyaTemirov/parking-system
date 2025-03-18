import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";
import { getCameraOperator } from "./camera.service.js";
import { getSessionByNumber } from "./sessions.service.js";
import tarifs from "@/helpers/prices.js";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    getIO().emit("inputCar", {
      number,
      plateImage,
      fullImage,
      cameraIp: req.headers.host,
      operatorId: operator.operatorId,
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

    const price = calculatePrice(session.startTime, new Date().toISOString(), session.tariffType);

    getIO().emit("outputCar", {
      number,
      plateImage,
      fullImage,
      price,
      cameraIp: req.headers.host,
      operatorId: operator.operatorId,
      session,
    });

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

  if (end < start) return "0м 0с";

  const durationMs = end - start;
  const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  const daysPrice = days * tarifCost;

  const totalPrice = hours > 0 ? daysPrice + tarifCost : daysPrice;

  return totalPrice || tarifCost;
};

const openFetch = async (status, ip, login, password) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/xml",
        Authorization: "Basic " + btoa(`${login}:${password}`),
        Cookie: "Secure; Secure",
      },
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }), // Игнорируем самоподписанный сертификат
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
