import express from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
const usersRouter = express.Router();

usersRouter.post("/", async (req, res) => {
  const { username, name, password } = req.body;

  if (username.length < 3 || password.length < 3) {
    return res.status(400).json({
      error: "password or username should be more than 3 letters long",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();

  return res.status(201).json(savedUser);
});

usersRouter.get("/", async (_req, res) => {
  const users = await User.find({});
  res.json(users);
});

export default usersRouter;
