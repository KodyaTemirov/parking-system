import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";
import { GETCAMERAOPERATOR } from "./camera.service.js";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await GETCAMERAOPERATOR(req.headers.host);

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

const outputCar = (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    getIO().emit("outputCar", { number, plateImage, fullImage });

    res.status(200).send("OK");
  } catch (error) {
    res.status(400).send(error);
  }
};

export { inputCar, outputCar };
