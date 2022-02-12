import { Server } from "socket.io";

// Init server
const server = new Server({
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const port = 3001;
server.listen(port);
console.log("listening on port " + port);

const matchMakingQueue: string[] = [];

// Put incoming connections into matchmaking queue
server.on("connection", async (socket) => {
  matchMakingQueue.push(socket.id);
  socket.join("lobby");
  socket.data.currentRoom = "lobby";

  // emits player move actions to the opponent
  socket.on("move", (args) =>
    socket.broadcast.to(socket.data.currentRoom).emit("move", args)
  );

  socket.on("rematch-request", () =>
    socket.broadcast.to(socket.data.currentRoom).emit("rematch-request")
  );

  socket.on("rematch-request-result", (result) =>
    socket.broadcast
      .to(socket.data.currentRoom)
      .emit("rematch-request-result", result)
  );

  // If a player disconnects while in queue, remove them from queue. While they disconnect during the match, their opponent wins
  socket.on("disconnect", () => {
    const room = socket.data.currentRoom;

    if (room === "lobby") {
      matchMakingQueue.splice(
        matchMakingQueue.findIndex((id) => id === socket.id),
        1
      );
    } else {
      server.to(room).emit("forfeit-win");
      server.to(room).disconnectSockets();
    }
  });
});

// Match the players lobby in queue every 3 seconds
setInterval(async () => {
  const sockets = await server.in("lobby").fetchSockets();

  while (matchMakingQueue.length > 1) {
    const p1Id = matchMakingQueue[0];
    const p2Id = matchMakingQueue[1];

    const p1Socket = sockets.find((s) => s.id === p1Id);
    const p2Socket = sockets.find((s) => s.id === p2Id);

    if (!p1Socket || !p2Socket) {
      console.error("socket not found during matchmaking");
      console.log("p1Id: " + p1Id);
      console.log("p2Id: " + p2Id);
      console.log("queue: " + matchMakingQueue);

      throw new Error("socket not found during matchmaking");
    }

    p1Socket.leave("lobby");
    p2Socket.leave("lobby");

    const room = p1Id + p2Id;

    p1Socket.join(room);
    p2Socket.join(room);

    p1Socket.data.currentRoom = room;
    p2Socket.data.currentRoom = room;

    const startingPlayer = getStartingPlayer();
    p1Socket.emit("matchFound", {
      color: "black",
      isStartingFirst: startingPlayer === "p1",
    });
    p2Socket.emit("matchFound", {
      color: "white",
      isStartingFirst: startingPlayer === "p2",
    });

    matchMakingQueue.splice(0, 2);
  }
}, 3000);

const getStartingPlayer = (): "p1" | "p2" =>
  Math.random() > 0.5 ? "p1" : "p2";
