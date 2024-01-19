import { MONGODB_URI, PORT } from "./utils/config";
import express from "express";
import usersRouter from "./routes/users";
import loginRouter from "./routes/login";
import postsRouter from "./routes/posts";
const app = express();
app.use(express.json());
import { info, errorLog } from "./utils/logger";
import mongoose from "mongoose";

mongoose.set("strictQuery", false);

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

info("connecting to", MONGODB_URI);

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

app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/posts", postsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
