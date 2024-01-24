import express from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { userExtractor } from "../utils/middleware";
import { RequestWithUser } from "../types";
import { io } from "..";

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
  const users = await User.find({}).populate("posts", {
    content: 1,
    id: 1,
  });
  res.json(users);
});

usersRouter.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).populate("posts", {
    content: 1,
    id: 1,
  });

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "user not found" }).end();
  }
});

usersRouter.put("/:id", userExtractor, async (req, res) => {
  const { username, name, password } = req.body;

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const userToUpdate = {
    username: username || undefined,
    name: name || undefined,
    passwordHash,
  };

  Object.keys(userToUpdate).forEach(
    (key) => userToUpdate[key] === undefined && delete userToUpdate[key]
  );

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    userToUpdate,
    {
      new: true,
    }
  );

  if (updatedUser) {
    res.json(updatedUser);
  } else {
    res.status(404).json({ error: "user not found" });
  }
});

usersRouter.delete("/:id", userExtractor, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (user) {
    res.status(204).end();
  } else {
    res.status(404).json({ error: "user not found" });
  }
});

usersRouter.get("/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).populate(
    "posts"
  );
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "user not found" }).end();
  }
});

usersRouter.put(
  "/:id/follow",
  userExtractor,
  async (req: RequestWithUser, res) => {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = req.user;

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    io.to(userToFollow.id).emit("notification", {
      message: `${currentUser.username} has followed you`,
    });

    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUser._id,
      currentUser,
      {
        new: true,
      }
    );
    await User.findByIdAndUpdate(userToFollow._id, userToFollow);

    return res.json(updatedCurrentUser);
  }
);

usersRouter.put(
  "/:id/unfollow",
  userExtractor,
  async (req: RequestWithUser, res) => {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = req.user;

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (userId) => userId.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (userId) => userId.toString() !== currentUser._id.toString()
    );

    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUser._id,
      currentUser,
      {
        new: true,
      }
    );
    await User.findByIdAndUpdate(userToUnfollow._id, userToUnfollow);

    return res.json(updatedCurrentUser);
  }
);

export default usersRouter;
