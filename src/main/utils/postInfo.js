const url = "https://raqamli-bozor.uz/services/platon-core/api";
import db from "@/db/database.js";
import { getImageFile } from "./getImageFile.js";

const postInfo = async (data) => {
  try {
    console.log(data);

    if (data.type == "insert" && data.event == "input") {
      const image = getImageFile(data.data.inputPlateImage);
      const imageFull = getImageFile(data.data.inputFullImage);

      const plateImageId = await uploadImage(image);
      const fullImageId = await uploadImage(imageFull);

      data.data.inputPlateImage = plateImageId;
      data.data.inputFullImage = fullImageId;
    } else if (data.type == "insert" && data.event == "output") {
      const image = getImageFile(data.data.outputPlateImage);
      const imageFull = getImageFile(data.data.outputFullImage);

      const plateImageId = await uploadImage(image);
      const fullImageId = await uploadImage(imageFull);

      data.data.outputPlateImage = plateImageId;
      data.data.outputFullImage = fullImageId;
    }

    const response = await axios.post(`${url}/v1/desktop/market/vehicles`, data);

    if (data.type == "insert") {
      db.prepare("UPDATE sessions SET isSync = 1 WHERE id = ?").run(data.data.id);
    } else {
      for (let i = 0; i < data.data.length; i++) {
        db.prepare("UPDATE sessions SET isSync = 1 WHERE id = ?").run(data.data[i].id);
      }
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

const uploadImage = async (filePath) => {
  const formDataOriginal = new FormData();
  const fileStream = fs.createReadStream(filePath);
  formDataOriginal.append("file", fileStream);
  const original = await uploadMedia(formDataOriginal);

  return original.id;
};

const uploadMedia = async (config) => {
  const res = await $fetch(
    "https://raqamli-bozor.uz/services/platon-core/web/v1/public/files/upload/category/vehicles",
    {
      method: "POST",
      body: config,
    }
  );
  return res;
};

export { postInfo, uploadImage };
