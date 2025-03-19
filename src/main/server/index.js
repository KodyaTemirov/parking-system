import { createServer } from "./server.js";

let mainWindow = {
  webContents: {
    // send: (channel, data) => {
    //   console.log(`Sending data to ${channel}:`, data);
    // },
  },
};

createServer(mainWindow);
