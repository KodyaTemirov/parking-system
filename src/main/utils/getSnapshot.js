import axios from "axios";
import { parsePlateData } from "./parsePlateData";

export const getSnapshot = async () => {
  try {
    const { data } = await axios.get("http://10.20.10.131/GetSnapshot/1", {
      headers: {
        "Content-Type": "application/xml",
        Authorization: "Basic YWRtaW46MTIzNDU2",
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
