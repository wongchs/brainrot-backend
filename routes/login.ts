import express from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const loginRouter = express.Router();

loginRouter.post("/", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: "invalid username or password",
    });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const SECRET = process.env.SECRET;
  if (!SECRET) {
    throw new Error("SECRET is not defined");
  }

  const token = jwt.sign(userForToken, SECRET);

  return res
    .status(200)
    .send({ token, username: user.username, name: user.name });
});

export default loginRouter;
