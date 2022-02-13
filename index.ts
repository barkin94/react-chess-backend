import server from "./init-server";
import { enterLobby, isInLobby, leaveLobby } from "./match-making";

server.on("connection", async (socket) => {
  socket.on("search-match", () => {
    enterLobby(socket);
  });

  socket.on("move", (args) =>
    socket.broadcast.to(socket.data.currentRoom).emit("move", args)
  );

  socket.on("rematch-request", () =>
    socket.broadcast.to(socket.data.currentRoom).emit("rematch-request")
  );

  socket.on("rematch-request-result", (result) => {
    socket.broadcast
      .to(socket.data.currentRoom)
      .emit("rematch-request-result", result);

    if (result === "rejected") {
      server.socketsLeave(socket.data.currentRoom);
    }
  });

  socket.on("disconnect", () => {
    if (isInLobby(socket)) {
      leaveLobby(socket);
    } else {
      const room = socket.data.currentRoom;
      server.to(room).emit("forfeit-win");
      server.socketsLeave(room);
    }
  });
});
