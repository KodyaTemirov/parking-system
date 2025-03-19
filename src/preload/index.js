import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
const api = {
  onMessage: (channel, callback) => {
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (_, data) => callback(data));
  },

  send: (channel, data) => {
    // console.log(`Sending data to ${channel}:`, data);
    ipcRenderer.send(channel, data);
  },

  getSelectedOperator: () => ipcRenderer.invoke("get-selected-operator"),

  onSelectedOperator: (callback) => {
    ipcRenderer.removeAllListeners("selected-operator");
    ipcRenderer.on("selected-operator", (_, operator) => callback(operator));
  },
};

// Экспорт API через `contextBridge`
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("Ошибка при экспорте API:", error);
  }
} else {
  window.api = api;
}
