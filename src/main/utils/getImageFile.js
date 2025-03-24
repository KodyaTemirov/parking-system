import { app } from "electron";
import path from "path";
import fs from "fs";

const isDev = !app.isPackaged;

const getImageFile = (fileName) => {
  try {
    const dbFolder = isDev
      ? process.cwd() // Корень проекта в dev режиме
      : app.getPath("userData");

    const imagesFolder = path.join(dbFolder, "images");
    const filePath = path.join(imagesFolder, fileName);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    return null;
  } catch (error) {
    console.error("Ошибка при получении файла:", error);
    return null;
  }
};

export { getImageFile };
