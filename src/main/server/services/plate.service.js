import { parsePlateData } from "@/utils/parsePlateData.js";
import { getIO } from "../../utils/socket";

const inputCar = (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { fullImage, plateImage, number } = parsePlateData(req.body);

    getIO().emit("inputCar", { number, plateImage, fullImage });

    res.status(200).send("OK");
  } catch (error) {
    console.error(`❌ Error processing ${eventName}:`, error);
    next(error);
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
    console.error(`❌ Error processing ${eventName}:`, error);
    next(error);
  }
};

export { inputCar, outputCar };
