import { app } from "electron";
import Store from "electron-store";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerSessionEvents } from "./events/sessionEvents.js";
import { registerPrintEvent } from "./events/printEvent.js";
import db from "@/db/database.js";
import { startServer, stopServer } from "./serverControl";
import { updateMenu } from "./menu";
import { exec } from "child_process";
import path from "path";

const store = new Store();

let mainWindow;

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  mainWindow = createWindow();

  exec("gradlew.bat clean build run", {
    cwd: "C:\\Users\\Mini\\Downloads\\Telegram Desktop\\VehicleRecognitionHttpSender_Fixed\\VehicleRecognitionHttpSender_Fixed",
    shell: true, // <- вот это важно
  }, (error, stdout, stderr) => {
    if (error) {
      console.error("Ошибка при запуске Java-сервера:", error.message);
      return;
    }
    console.log("STDOUT:", stdout);
    console.error("STDERR:", stderr);
  });


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
  registerPrintEvent();
});