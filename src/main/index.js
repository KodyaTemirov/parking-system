import { app } from "electron";
import Store from "electron-store";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerSessionEvents } from "./events/sessionEvents.js";
import db from "@/db/database.js";
import { startServer, stopServer } from "./serverControl";
import { updateMenu } from "./menu";

const store = new Store(); // Добавляем создание store

let mainWindow;

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  mainWindow = createWindow();

  if (!store.get("checkboxState", false)) {
    startServer(mainWindow);
  }

  updateMenu(mainWindow);

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
