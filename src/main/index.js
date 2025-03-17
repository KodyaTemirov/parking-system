import { app, Menu, clipboard } from "electron";
import { createServer } from "./server/server";
import { createWindow } from "./window";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { registerSessionEvents } from "./events/sessionEvents.js";
import db from "@/db/database.js";
import Store from "electron-store";
import os from "os";

const store = new Store();

const getCheckboxState = () => store.get("checkboxState", false);
const updateCheckboxState = (state) => store.set("checkboxState", state);

let mainWindow;
let server;
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

const startServer = () => {
  try {
    server = createServer(mainWindow);

    const address = server.address();
    serverIP = getLocalIP();
    serverPort = address.port; // Получаем реальный порт из сервера

    console.log(`✅ Сервер запущен: ${serverIP}:${serverPort}`);
    updateMenu(); // Обновляем меню после запуска
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error);
  }
};

const stopServer = async () => {
  if (server) {
    await server.close();
    server = null;
    serverIP = "Не запущен";
    serverPort = null;
    console.log("⛔️ Сервер остановлен");
    updateMenu(); // Обновляем меню после остановки
  }
};

const handleCheckboxToggle = async (newState) => {
  updateCheckboxState(newState);

  if (newState) {
    await stopServer(); // Останавливаем сервер
  } else {
    startServer(); // Запускаем сервер
  }
};

const copyToClipboard = (text) => {
  clipboard.writeText(text);
};

const createMenuTemplate = () => {
  const isChecked = getCheckboxState();

  const serverInfo = serverIP === "Не запущен" ? "Не запущен" : `${serverIP}:${serverPort}`;

  return [
    {
      label: "Parkly",
      submenu: [
        {
          label: "Переключиться на клиента",
          type: "checkbox",
          checked: isChecked,
          click: (menuItem) => handleCheckboxToggle(menuItem.checked),
        },
        {
          label: `IP сервера: ${serverInfo}`,
          click: () => copyToClipboard(serverInfo),
          enabled: server !== null, // Отключаем, если сервер не работает
        },
        { label: "Выход", role: "quit" },
      ],
    },
  ];
};

const updateMenu = () => {
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  const checkboxState = getCheckboxState();

  electronApp.setAppUserModelId("com.electron");

  mainWindow = createWindow();

  if (!checkboxState) {
    startServer();
  }

  updateMenu(); // Создаём меню при старте

  console.log("💾 Путь к базе:", db.name);

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("quit", async () => {
    await stopServer();
    await db.close();
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      mainWindow = createWindow();
    }
  });

  registerSessionEvents();
});
