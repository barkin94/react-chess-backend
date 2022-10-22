import { Server } from "socket.io";
import dotenv from "dotenv";

// production environment values are passed in via docker
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "./.env.development" });
}

// Init server
const server = new Server({
  cors: process.env.CORS_ORIGIN
    ? {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
      }
    : undefined,
});

const port = parseInt(process.env.PORT || "3001");
server.listen(port);
console.log("listening on port: " + port);

export default server;
