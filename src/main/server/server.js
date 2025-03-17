import express from "express";
import xmlParser from "express-xml-bodyparser";
import plateRoutes from "./routes/plateRoutes.js";

export const createServer = (mainWindow) => {
  const app = express();

  app.use(xmlParser());

  // Маршруты
  app.use("/api", plateRoutes(mainWindow));

  const server = app.listen(9061, () => console.log("Server is listening on port 9061"));

  return server;
};
