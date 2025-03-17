let io;
import { Server } from "socket.io";

function initializeSocket(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.send("connected", () => {
      return { message: "Connected" };
    });

    socket.on("disconnect", async () => {
      // const findedUser = await UserModel.findOne({ where: { socket_id: socket.id } });
      // if (findedUser) {
      //   findedUser.socket_id = null;
      //   await findedUser.save();
      // } else {
      //   console.error("User not found on disconnect");
      // }
    });

    // socket.on("courierLocationUpdate", async (data) => {
    //   // const user = await UserModel.findOne({ where: { id: data.user_id } });

    //   // user.location = data.location;
    //   // await user.save();
    //   // const client = await UserModel.findOne({ where: { id: data.client_id } });

    //   if (client) {
    //     if (client.socket_id) {
    //       socket.to(client.socket_id).emit("courierLocationUpdate", data);
    //     }
    //   }
    // });
  });
}

function getIO() {
  return io;
}

async function getClientSocket(id) {
  return await UserModel.findOne({ where: { id }, attributes: ["socketId"] });
}

export { initializeSocket, getIO, getClientSocket };
