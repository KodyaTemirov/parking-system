import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";
import { getCameraOperator } from "./camera.service.js";
import db from "@/db/database.js";
import { tarifs } from "@/utils/prices.js";
import { saveBase64Image } from "../../utils/saveBase64Image.js";
import {
  getLastPaymentTime,
  getLastPaymentTimeId,
  getSessionById,
  getSessionByNumber,
  handleOutputSession,
  handleOutputSessionId,
  isPayedTodayId,
} from "../../utils/sessionFunctions.js";
import { calculatePrice, openFetch } from "../../utils/plateFunctions.js";
import { getSnapshot } from "../../utils/getSnapshot.js";
import {
  calculateParkingCost,
  getLastSession,
  getLastSessionUniversal,
  isPayedToday,
} from "../../utils/calculatePrice.js";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    const isPayedTodayValue = await isPayedToday(number);

    if (isPayedTodayValue) {
      const lastSession = getLastSession(number);

      getIO().emit(`payedToday-${operator.operatorId}`, {
        number,
        plateImage,
        fullImage,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        eventName: "input",
        session: lastSession,
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

    const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);
    // const snapUrl = saveBase64Image(snapImage);

    const isPayedTodayValue = await isPayedToday(id, "id");

    if (isPayedTodayValue) {
      const lastSession = getLastSession(id, "id");

      const camera = await getCameraOperator(cameraIp);
      // openFetch(true, cameraIp, camera.login, camera.password);

      // setTimeout(() => {
      //   openFetch(false, cameraIp, camera.login, camera.password);
      // }, 100);

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
        session: lastSession,
        eventName: "output",
      });

      // openFetch(true, req.headers.host, operator.login, operator.password);
      // setTimeout(() => {
      //   openFetch(false, req.headers.host, operator.login, operator.password);
      // }, 100);

      return res.status(200).send("OK");
    } else if (session) {
      const price = calculateParkingCost(
        session.startTime,
        tarifs.find((item) => item.id == session.tariffType).pricePerDay
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
      const sessionNotEnded = getLastSessionUniversal(number);

      const price = calculateParkingCost(
        sessionNotEnded.startTime,
        tarifs.find((item) => item.id == sessionNotEnded.tariffType).pricePerDay
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
          plateImageFile,
          paymentMethod: 1,
          cameraIp: cameraIp,
          fullImageFile,
          outputCost: 0,
        });

        // openFetch(true, req.headers.host, operator.login, operator.password);
        // setTimeout(() => {
        //   openFetch(false, req.headers.host, operator.login, operator.password);
        // }, 100);

        getIO().emit(`payedToday-${operator.operatorId}`, {
          number,
          plateImage,
          fullImage,
          cameraIp: req.headers.host,
          operatorId: operator.operatorId,
          session: sessionNotEnded,
          eventName: "output",
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
        plateImageFile: null,
        paymentMethod: 1,
        cameraIp: cameraIp,
        fullImageFile: snapUrl,
        outputCost: 0,
      });

      // openFetch(true, req.headers.host, operator.login, operator.password);
      // setTimeout(() => {
      //   openFetch(false, req.headers.host, operator.login, operator.password);
      // }, 100);

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
        tarifs.find((item) => item.id == session.tariffType).pricePerDay
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
        tarifs.find((item) => item.id == sessionNotEnded.tariffType).pricePerDay
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

        handleOutputSession({
          number: null,
          plateImageFile: null,
          paymentMethod: 1,
          cameraIp: cameraIp,
          fullImageFile: snapUrl,
          outputCost: 0,
        });

        // openFetch(true, req.headers.host, operator.login, operator.password);
        // setTimeout(() => {
        //   openFetch(false, req.headers.host, operator.login, operator.password);
        // }, 100);

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
    res.status(400).send(error);
  }
};

export { inputCar, outputCar, outputCarById, inputCarById };
