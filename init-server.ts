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

export default server;
