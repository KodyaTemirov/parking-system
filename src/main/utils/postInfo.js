const url = "https://raqamli-bozor.uz/services/platon-core/api";
import db from "@/db/database.js";
import { getImageFile } from "./getImageFile.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const postInfo = async (data) => {
  try {
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

    const response = await axios.post(`${url}/v1/desktop/market/vehicles`, data, {
      headers: {
        token: "68fa03a7-ff2f-cfdf-bbe7-c4e42e93a13e",
      },
    });

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
  try {
    const formDataOriginal = new FormData();
    const fileStream = fs.createReadStream(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл ${filePath} не найден`);
    }
    formDataOriginal.append("file", fileStream);
    const original = await uploadMedia(formDataOriginal);
    return original.id;
  } catch (error) {
    throw error;
  }
};

const uploadMedia = async (config) => {
  try {
    const res = await axios.post(
      "https://raqamli-bozor.uz/services/platon-core/web/v1/public/files/upload/category/universal",
      config,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "multipart/form-data;",
        },
      }
    );

    return res.data;
  } catch (error) {
    throw error;
  }
};

export { postInfo, uploadImage };
