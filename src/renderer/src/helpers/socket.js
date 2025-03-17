import { io } from "socket.io-client";

const socket = io("http://10.20.11.143:9061", {
  reconnectionAttempts: 5,
  timeout: 20000, // 20 секунд
  pingTimeout: 60000,
  pingInterval: 25000,
});

export default socket;
