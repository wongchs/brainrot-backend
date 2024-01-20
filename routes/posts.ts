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

postsRouter.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate("user", {
    username: 1,
    name: 1,
    id: 1,
  });

  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "post not found" }).end();
  }
});

postsRouter.delete("/:id", userExtractor, async (req: RequestWithUser, res) => {
  const user = req.user;
  const postToDelete = await Post.findById(req.params.id);

  if (user.id.toString() === postToDelete.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } else {
    res.status(403).json({ error: "invalid credentials" });
  }
});

export default postsRouter;
