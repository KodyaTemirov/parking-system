const url = "https://raqamli-bozor.uz/services/platon-core/api";
import db from "@/db/database.js";
import { getImageFile } from "./getImageFile.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { checkInternetConnection } from "@/utils/checkInternet.js";

const postInfo = async (data) => {
  try {
    if (data.type == "insert" && data.event == "input") {
      if (data.data.inputPlateImage) {
        const image = getImageFile(data.data.inputPlateImage);
        const plateImageId = await uploadImage(image);
        data.data.inputPlateImage = plateImageId;
      }
      if (data.data.inputFullImage) {
        const imageFull = getImageFile(data.data.inputFullImage);
        const fullImageId = await uploadImage(imageFull);
        data.data.inputFullImage = fullImageId;
      }
    } else if (data.type == "insert" && data.event == "output") {
      if (data.data.outputPlateImage) {
        const image = getImageFile(data.data.outputPlateImage);
        const plateImageId = await uploadImage(image);
        data.data.outputPlateImage = plateImageId;
      }

      if (data.data.outputFullImage) {
        const imageFull = getImageFile(data.data.outputFullImage);
        const fullImageId = await uploadImage(imageFull);
        data.data.outputFullImage = fullImageId;
      }
    }

    if(data.type == "insert" && !data.data.plateNumber){
      data.data.plateNumber = data.data.id
    }

    console.log(data);

    const response = await axios.post(`${url}/v1/desktop/market/vehicles`, data, {
      headers: {
        token: "41b197f7-27b1-4b33-8a91-a8232b664e26",
      },
    });

    console.log(response.data);

    if (data.type == "insert") {
      db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(data.data.id);
    } else {
      for (let i = 0; i < data.data.length; i++) {
        db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(
          data.data[i].id
        );
      }
    }

    return response.data;
  } catch (error) {
    console.log(error)
    throw error;
  }
};

const uploadImage = async (filePath) => {
  try {
    if(!filePath){
      throw new Error(`Пустой путь`);
    }
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


const uploadOldInfos = async () => {
  try {
    if (!(await checkInternetConnection())) return;
    console.log("CRON STARTED ===================================");
  
    const stmt = db.prepare("SELECT * FROM sessions where isUpdated = 1 or isSync = 0");
    const sessions = stmt.all();
    for (const item of sessions) {
      if(!item.plateNumber){
        item.plateNumber = item.id
      }
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
  
    const sessionIds = sessions.map((session) => session.id);
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => "?").join(",");
      db.prepare(
        `UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (${placeholders})`
      ).run(...sessionIds);
    }
  } catch (error) {
    console.log(error);
  }
}


export { postInfo, uploadImage,uploadOldInfos };
