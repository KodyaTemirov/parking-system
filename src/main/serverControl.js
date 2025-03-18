import { createServer } from "./server/server";
import os from "os";

let server = null;
let serverIP = "Не запущен";
let serverPort = null;

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface || []) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "127.0.0.1";
};

export const startServer = (mainWindow) => {
  try {
    server = createServer(mainWindow);

    const address = server.address();
    serverIP = getLocalIP();
    serverPort = address.port;

    console.log(`✅ Сервер запущен: ${serverIP}:${serverPort}`);
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error);
  }
};

export const stopServer = async () => {
  if (server) {
    await server.close();
    server = null;
    serverIP = "Не запущен";
    serverPort = null;
    console.log("⛔️ Сервер остановлен");
  }
};

export const getServerInfo = () => {
  return serverIP === "Не запущен" ? "Не запущен" : `${serverIP}:${serverPort}`;
};
