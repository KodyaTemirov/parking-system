import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Кастомный API
const api = {
  onMessage: (channel, callback) => {
    ipcRenderer.removeAllListeners(channel); // Убираем старые слушатели
    ipcRenderer.on(channel, (_, data) => callback(data));
  },

  send: (channel, data) => {
    console.log(`Sending data to ${channel}:`, data);
    ipcRenderer.send(channel, data);
  },
};

// Экспозим API в рендерер через contextBridge
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
