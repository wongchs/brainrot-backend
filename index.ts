import { MONGODB_URI, PORT } from "./utils/config";
import express from "express";
import http from "http";
import usersRouter from "./routes/users";
import loginRouter from "./routes/login";
import postsRouter from "./routes/posts";
const app = express();
import cors from "cors";
app.use(express.json());
import { info, errorLog } from "./utils/logger";
import mongoose from "mongoose";
import { requestLogger, tokenExtractor } from "./utils/middleware";
import { Server } from "socket.io";

mongoose.set("strictQuery", false);

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

info("connecting to", MONGODB_URI);

const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.use(cors());
app.use(requestLogger);
app.use(tokenExtractor);

mongoose
  .connect(MONGODB_URI)
  .then((_result) => {
    info("connected to MongoDB");
  })
  .catch((error) => {
    errorLog("error connecting to MongoDB:", error.message);
  });

app.get("/ping", (_req, res) => {
  console.log("someone pinged here");
  res.send("pong");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join", (roomId) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("someone left");
  });
});

app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/posts", postsRouter);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
