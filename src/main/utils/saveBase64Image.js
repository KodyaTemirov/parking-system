import fs from "fs";
import path from "path";
import { app } from "electron";

const isDev = !app.isPackaged;

const dbFolder = isDev
  ? process.cwd() // Корень проекта в dev режиме
  : app.getPath("userData");

const imagesFolder = path.join(dbFolder, "images");

if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder, { recursive: true });
}

const saveBase64Image = (base64String) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Некорректный формат base64 изображения");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const extension = mimeType.split("/")[1];

  const fileName = `${Date.now()}.${extension}`;
  const filePath = path.join(imagesFolder, fileName); // Используем imagesFolder

  fs.writeFileSync(filePath, base64Data, "base64");
  console.log("Изображение сохранено:", filePath);

  return fileName;
};

const deleteImageFile = (imagePath) => {
  if (!imagePath) {
    console.error("Путь к файлу не указан");
    return;
  }

  const imageFullPath = path.join(imagesFolder, imagePath);

  if (fs.existsSync(imageFullPath)) {
    fs.unlink(imageFullPath, (err) => {
      if (err) {
        console.error("Ошибка при удалении файла:", err);
      } else {
        console.log("Файл успешно удалён:", imageFullPath);
      }
    });
  } else {
    console.log("Файл не найден, возможно уже удалён:", imageFullPath);
  }
};

export { saveBase64Image, deleteImageFile };
