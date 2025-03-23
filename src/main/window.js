import { BrowserWindow, shell, Menu } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

function getAppURL() {
  return is.dev && process.env["ELECTRON_RENDERER_URL"]
    ? process.env["ELECTRON_RENDERER_URL"]
    : join(__dirname, "../renderer/index.html");
}

export function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: "Parkly",
    // fullscreen: true, // Добавлено для полноэкранного режима

    webPreferences: {
      nodeIntegration: false,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.loadURL(getAppURL());

  return mainWindow;
}
