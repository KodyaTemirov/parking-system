import axios from "axios";
import { parsePlateData } from "./parsePlateData";

export const getSnapshot = async (ip, login, password) => {
  try {
    const { data } = await axios.get(`http://${ip}/GetSnapshot/1`, {
      headers: {
        "Content-Type": "application/xml",
        Authorization: "Basic " + btoa(`${login}:${password}`),
        Cookie: "Secure; Secure; Secure",
      },
      maxRedirects: 5,
      responseType: "arraybuffer",
    });

    const base64Data = `data:image/jpeg;base64,${Buffer.from(data, "binary").toString("base64")}`;

    return base64Data;
  } catch (error) {
    console.error("Ошибка при отправке запроса:", error);
  }
};
