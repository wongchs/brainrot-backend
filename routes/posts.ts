import express from "express";
import Post from "../models/Post";
import { userExtractor } from "../utils/middleware";
import { RequestWithUser } from "../types";

const postsRouter = express.Router();

postsRouter.get("/", async (_req, res) => {
  const posts = await Post.find({}).populate("user", {
    username: 1,
    name: 1,
    id: 1,
  });
  res.json(posts);
});

postsRouter.post("/", userExtractor, async (req: RequestWithUser, res) => {
  const body = req.body;
  const user = req.user;

  if (!body.content) {
    return res.status(400).end();
  }

  const post = new Post({
    content: body.content,
    user: user.id,
  });

  const savedPost = await post.save();
  user.posts = user.posts.concat(savedPost._id);
  await user.save();
  return res.status(201).json(savedPost);
});

export default postsRouter;
