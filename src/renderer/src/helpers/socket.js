import { io } from "socket.io-client";

const isLocal =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const backendURL = isLocal ? "http://127.0.0.1:9061" : "http://10.20.11.143:9061";

const socket = io(backendURL, {
  reconnectionAttempts: 5,
  timeout: 20000, // 20 секунд
  pingTimeout: 60000,
  pingInterval: 25000,
});

export default socket;
