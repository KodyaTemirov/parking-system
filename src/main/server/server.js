import express from "express";
import xmlParser from "express-xml-bodyparser";
import router from "./routes/index";
import { initializeSocket } from "../utils/socket.js";
import http from "http";
import cors from "cors";

export const createServer = (mainWindow) => {
  const app = express();
  const listenApp = http.createServer(app);

  app.use(xmlParser());
  app.use(cors());
  app.use(
    express.json({
      limit: "50mb",
    })
  );
  initializeSocket(listenApp);

  // Маршруты
  // app.use("/api", plateRoutes(mainWindow));
  app.use("/api", router);

  const server = listenApp.listen(9061, () => console.log("Server is listening on port 9061"));

  return server;
};
