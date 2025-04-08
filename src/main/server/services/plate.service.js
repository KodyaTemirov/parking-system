import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "@/utils/socket";
import { getCameraOperator } from "./camera.service.js";
import { tariffs } from "@/config";
import { saveBase64Image } from "@/utils/saveBase64Image.js";
import { handleOutputSession, handleOutputSessionId } from "@/utils/sessionFunctions.js";
import { isEnoughTime, isInner, setInner } from "@/utils/plateFunctions.js";
import { getSnapshot } from "@/utils/getSnapshot.js";
import {
  calculateParkingCost,
  getLastSession,
  getLastSessionUniversal,
  isPayedToday,
} from "@/utils/calculatePrice.js";
import { sendParkStats } from "../../utils/sessionFunctions.js";

const inputCar = async (req, res) => {
  console.log("Input CAR:", req.headers.host);
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    const check = await isEnoughTime(number, "number");

    if (!check) {
      return res.status(200).send("Not 30 sec yet");
    }

    const isInnerCheck = await isInner(number, "number");

    if (isInnerCheck) {
      getIO().emit(`notification-${operator.operatorId}`, {
        type: "error",
        message: `${isInnerCheck.id} allaqachon ichkarida!`,
      });
      res.status(200).send("Car already inner");
      return;
    }

    const isPayedTodayValue = isPayedToday(number);

    if (isPayedTodayValue) {
      const lastSession = getLastSession(number);

      getIO().emit(`notification-${operator.operatorId}`, {
        type: "success",
        message: `${lastSession.id} qarzi mavjud emas!`,
      });

      await setInner(number, 1, "number");
      await sendParkStats();

      const camera = await getCameraOperator(req.headers.host);

      // await openFetchByIp(req.headers.host);

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

const inputCarById = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { id } = req.params;
    const { cameraIp } = req.query;

    const operator = await getCameraOperator(cameraIp);

    if (!operator) return res.status(200).send("Operator not found");

    const isInnerCheck = await isInner(id, "id");

    if (isInnerCheck) {
      getIO().emit(`notification-${operator.operatorId}`, {
        type: "error",
        message: `${isInnerCheck.id} allaqachon ichkarida!`,
      });
      res.status(200).send("Car already inner");
      return;
    }

    const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);

    const isPayedTodayValue = await isPayedToday(id, "id");

    if (isPayedTodayValue) {
      const lastSession = getLastSession(id, "id");

      await openFetchByIp(cameraIp);

      await setInner(id, 1, "id");
      await sendParkStats();

      getIO().emit(`notification-${operator.operatorId}`, {
        type: "success",
        message: `${lastSession.id} qarzi mavjud emas!`,
      });

      res.status(200).send({
        number: null,
        plateImage: null,
        fullImage: snapImage,
        cameraIp: cameraIp,
        operatorId: operator.operatorId,
        session: lastSession,
        eventName: "payedToday",
      });

      return;
    }

    res.status(200).send({
      number: null,
      plateImage: null,
      fullImage: snapImage,
      cameraIp: cameraIp,
      operatorId: operator.operatorId,
      eventName: "input",
    });
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

    const check = await isEnoughTime(number, "number");

    if (!check) {
      return res.status(200).send("Not 30 sec yet");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const isPayedTodayValue = isPayedToday(number);
    const session = getLastSession(number);

    if (isPayedTodayValue) {
      const lastSession = getLastSession(number);

      const plateImageFile = saveBase64Image(plateImage);
      const fullImageFile = saveBase64Image(fullImage);

      handleOutputSession({
        number,
        plateImage: plateImageFile,
        paymentMethod: 1,
        cameraIp: req.headers.host,
        fullImage: fullImageFile,
        outputCost: 0,
      });

      await sendParkStats();
      await setInner(number, 0, "number");

      getIO().emit(`notification-${operator.operatorId}`, {
        type: "success",
        message: `${lastSession.id} qarzi mavjud emas!`,
      });

      // await openFetchByIp(req.headers.host);

      return res.status(200).send("OK");
    } else if (session) {
      const price = calculateParkingCost(
        session.startTime,
        tariffs.find((item) => item.id == session.tariffType).pricePerDay
      );

      getIO().emit(`outputCar-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        price: price - session.outputCost,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
      });

      return res.status(200).send("OK");
    } else {
      const sessionNotEnded = getLastSessionUniversal(number, "number");

      const price = calculateParkingCost(
        sessionNotEnded.startTime,
        tariffs.find((item) => item.id == sessionNotEnded.tariffType).pricePerDay
      );

      if (price > 0) {
        getIO().emit(`outputCar-${operator.operatorId}`, {
          number,
          plateImage,
          fullImage,
          price: price,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session: sessionNotEnded,
          eventName: "output",
        });
      } else {
        const plateImageFile = saveBase64Image(plateImage);
        const fullImageFile = saveBase64Image(fullImage);

        handleOutputSession({
          number,
          plateImage: plateImageFile,
          paymentMethod: 1,
          cameraIp: req.headers.host,
          fullImage: fullImageFile,
          outputCost: 0,
        });

        await setInner(number, 0, "number");
        await sendParkStats();

        // await openFetchByIp(req.headers.host);

        getIO().emit(`notification-${operator.operatorId}`, {
          type: "success",
          message: `${sessionNotEnded.id} qarzi mavjud emas!`,
        });
      }
      return res.status(200).send("OK");
    }
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

    const { id } = req.params;
    const { cameraIp } = req.query;

    const operator = await getCameraOperator(cameraIp);

    if (!operator) return res.status(200).send("Operator not found");

    const isPayedTodayValue = isPayedToday(id, "id");
    const session = getLastSession(id, "id");

    if (isPayedTodayValue) {
      const lastSession = getLastSession(id, "id");

      const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);
      const snapUrl = saveBase64Image(snapImage);

      handleOutputSessionId({
        id: id,
        plateImage: null,
        paymentMethod: 1,
        cameraIp: cameraIp,
        fullImage: snapUrl,
        outputCost: 0,
      });

      await setInner(id, 0, "id");
      await sendParkStats();

      await openFetchByIp(cameraIp);

      getIO().emit(`notification-${operator.operatorId}`, {
        type: "success",
        message: `${lastSession.id} qarzi mavjud emas!`,
      });

      return res.status(200).send({
        number: null,
        plateImage: null,
        fullImage: snapImage,
        cameraIp: cameraIp,
        operatorId: operator.operatorId,
        session: lastSession,
        eventName: "payedToday",
      });
    } else if (session) {
      const price = calculateParkingCost(
        session.startTime,
        tariffs.find((item) => item.id == session.tariffType).pricePerDay
      );

      const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);

      return res.status(200).send({
        number: null,
        plateImage: null,
        fullImage: snapImage,
        price: price - session.outputCost,
        cameraIp: cameraIp,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
      });
    } else {
      const sessionNotEnded = getLastSessionUniversal(id, "id");
      const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);
      const price = calculateParkingCost(
        sessionNotEnded.startTime,
        tariffs.find((item) => item.id == sessionNotEnded.tariffType).pricePerDay
      );

      if (price > 0) {
        return res.status(200).send({
          number: null,
          plateImage: null,
          fullImage: snapImage,
          price: price,
          cameraIp: cameraIp,
          operatorId: operator.operatorId,
          session: sessionNotEnded,
          eventName: "output",
        });
      } else {
        const snapUrl = saveBase64Image(snapImage);

        handleOutputSessionId({
          id: id,
          plateImage: null,
          paymentMethod: 1,
          cameraIp: cameraIp,
          fullImage: snapUrl,
          outputCost: 0,
        });

        await openFetchByIp(cameraIp);

        await setInner(id, 0, "id");
        await sendParkStats();

        getIO().emit(`notification-${operator.operatorId}`, {
          type: "success",
          message: `${sessionNotEnded.id} qarzi mavjud emas!`,
        });

        return res.status(200).send({
          number: null,
          plateImage: null,
          fullImage: snapImage,
          cameraIp: cameraIp,
          operatorId: operator.operatorId,
          session: sessionNotEnded,
          eventName: "payedToday",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

export { inputCar, outputCar, outputCarById, inputCarById };
