import { Socket } from "socket.io";
import server from "./init-server";

const matchMakingQueue: string[] = [];

export const enterLobby = (socket: Socket) => {
  if (isInMatch(socket)) {
    socket.broadcast.to(socket.data.currentRoom).emit("forfeit-win");
    socket.leave(socket.data.currentRoom);
  }

  socket.join("lobby");
  socket.data.currentRoom = "lobby";
  matchMakingQueue.push(socket.id);
};

export const leaveLobby = (socket: Socket) => {
  socket.leave("lobby");
  delete socket.data.currentRoom;
  matchMakingQueue.splice(
    matchMakingQueue.findIndex((id) => id === socket.id),
    1
  );
};

export const isInMatch = (socket: Socket) => {
  const currentlyInMatch =
    socket.data.currentRoom !== undefined &&
    socket.data.currentRoom !== "lobby";

  if (currentlyInMatch && matchMakingQueue.some((id) => id === socket.id)) {
    throw new Error(
      "socket is in match yet appears to be in match making queue"
    );
  }

  return currentlyInMatch;
};

export const isInLobby = (socket: Socket) => {
  const currentRoomIsLobby = socket.data?.currentRoom === "lobby";
  if (currentRoomIsLobby && !matchMakingQueue.some((id) => id === socket.id)) {
    throw new Error(
      "socket's current room is lobby yet it is not in match making queue"
    );
  }
  return currentRoomIsLobby;
};

// Match the players in lobby every 3 seconds
setInterval(async () => {
  const sockets = await server.in("lobby").fetchSockets();

  while (matchMakingQueue.length > 1) {
    const p1SocketId = matchMakingQueue[0];
    const p2SocketId = matchMakingQueue[1];

    const p1Socket = sockets.find((s) => s.id === p1SocketId);
    const p2Socket = sockets.find((s) => s.id === p2SocketId);

    if (!p1Socket || !p2Socket) {
      console.error("socket not found during matchmaking");
      console.log("p1Id: " + p1SocketId);
      console.log("p2Id: " + p2SocketId);
      console.log("queue: " + matchMakingQueue);

      throw new Error("socket not found during matchmaking");
    }

    p1Socket.leave("lobby");
    p2Socket.leave("lobby");
    matchMakingQueue.splice(0, 2);

    const room = p1SocketId.concat(p2SocketId);

    p1Socket.join(room);
    p2Socket.join(room);

    p1Socket.data.currentRoom = room;
    p2Socket.data.currentRoom = room;

    p1Socket.emit("matchFound", { color: "black" });
    p2Socket.emit("matchFound", { color: "white" });
  }
}, 3000);
