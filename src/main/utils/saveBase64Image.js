import fs from "fs";
import path from "path";

const saveBase64Image = (base64String, outputPath) => {
  try {
    const base64Data = base64String.includes(",")
      ? base64String.split(",")[1]
      : base64String;

    const imageBuffer = Buffer.from(base64Data, "base64");

    const dirPath = path.dirname(outputPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(outputPath, imageBuffer);

    console.log(`Изображение сохранено по пути: ${outputPath}`);
  } catch (error) {
    console.error(`Ошибка при сохранении изображения: ${error}`);
  }
};

export default saveBase64Image;
