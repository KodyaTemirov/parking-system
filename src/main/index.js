import { app } from "electron";
import { createServer } from "./server/server";
import { createWindow } from "./window";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { registerSessionEvents } from "./events/sessionEvents.js";
import db from "@/db/database.js";

let mainWindow;
let server;

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  mainWindow = createWindow();
  server = createServer(mainWindow);

  console.log("💾 Путь к базе:", db.name);

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      server.close();
      db.close();
    }
  });

  registerSessionEvents();
});
