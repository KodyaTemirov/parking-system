import { io } from "socket.io-client";
import { ipServer } from "@/config";

export const socket = io(ipServer, {
  reconnectionAttempts: 5,
  timeout: 20000, // 20 секунд
  pingTimeout: 60000,
  pingInterval: 25000,
});
