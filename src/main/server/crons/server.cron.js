import axios from "axios";
import cron from "node-cron";
import db from "../../db/database.js";
import { checkInternetConnection } from "../../utils/checkInternet.js";

const startCronJob = () => {
  cron.schedule("0 0,12 * * *", async () => {
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

    axios.post(`https://raqamli-bozor.uz/services/platon-core/api/v2/desktop/market/vehicles`, {
      data: sessions,
    });

    db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (?)").run(
      sessions.map((session) => session.id)
    );
  });

  cron.schedule("0 0 1 * *", () => {
    console.log("Крон запущен 1 числа каждого месяца");
  });
};

export default startCronJob;
