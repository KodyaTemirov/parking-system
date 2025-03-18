let io;
import { Server } from "socket.io";

function initializeSocket(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.send("connected", () => {
      return { message: "Connected" };
    });

    socket.on("disconnect", async () => {});
  });
}

function getIO() {
  return io;
}

export { initializeSocket, getIO };
