import axios from "axios";
import cron from "node-cron";
import db from "../../db/database.js";
import { checkInternetConnection } from "../../utils/checkInternet.js";
import { isPayedToday } from "../../utils/calculatePrice.js";
import { deleteSession } from "../../utils/sessionFunctions.js";
import { deleteImageFile } from "../../utils/saveBase64Image.js";
import { getImageFile } from "../../utils/getImageFile.js";
import { uploadImage } from "../../utils/postInfo.js";

const startCronJob = () => {
  cron.schedule("*/12 * * * *", async () => {
    try {
      if (!checkInternetConnection()) return;

      const stmt = db.prepare("SELECT * FROM sessions where isUpdated = 1 or isSync = 0");
      const sessions = stmt.all();
      for (const item of sessions) {
        if (item.inputPlateImage != null && item.inputFullImage != null) {
          const image = getImageFile(item.inputPlateImage);
          const imageFull = getImageFile(item.inputFullImage);

          const plateImageId = await uploadImage(image);
          const fullImageId = await uploadImage(imageFull);

          item.inputPlateImage = plateImageId;
          item.inputFullImage = fullImageId;
        }
        if (item.outputPlateImage != null && item.outputFullImage != null) {
          const image = getImageFile(item.outputPlateImage);
          const imageFull = getImageFile(item.outputFullImage);

          const plateImageId = await uploadImage(image);
          const fullImageId = await uploadImage(imageFull);

          item.outputPlateImage = plateImageId;
          item.outputFullImage = fullImageId;
        }
      }

      axios.post(
        `https://raqamli-bozor.uz/services/platon-core/api/v2/desktop/market/vehicles`,
        {
          data: sessions,
        },
        {
          headers: {
            token: "68fa03a7-ff2f-cfdf-bbe7-c4e42e93a13e",
          },
        }
      );

      db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (?)").run(
        sessions.map((session) => session.id)
      );
    } catch (error) {
      console.log(error);
    }
  });

  cron.schedule("0 0 * * *", () => {
    const stmt = db.prepare(
      `SELECT * FROM sessions where isUpdated = 0 and isSync = 1 and endTime is not null and isInner = 0`
    );

    const sessions = stmt.all();

    const filteredSessions = sessions.filter((session) => {
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const diffTime = Math.abs(endTime - startTime);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 30;
    });

    for (const session of filteredSessions) {
      const isPayed = isPayedToday(
        session.plateNumber || session.id,
        session.plateNumber ? "number" : "id"
      );

      if (!isPayed) {
        deleteImageFile(session.inputPlateImage);
        deleteImageFile(session.inputFullImage);
        deleteImageFile(session.outputPlateImage);
        deleteImageFile(session.outputFullImage);

        deleteSession(session.id);
      }
    }
  });
};

export default startCronJob;
