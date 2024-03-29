import express from "express";
import Post from "../models/Post";
import { userExtractor } from "../utils/middleware";
import { RequestWithUser } from "../types";
import User from "../models/User";
import { io } from "..";

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
    user.posts = user.posts.filter(
      (postId) => postId.toString() !== req.params.id
    );
    await User.findByIdAndUpdate(user.id, user);
    await Post.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } else {
    res.status(403).json({ error: "invalid credentials" });
  }
});

postsRouter.put("/:id", userExtractor, async (req: RequestWithUser, res) => {
  const user = req.user;
  const body = req.body;

  const postToUpdate = await Post.findById(req.params.id);

  if (user.id.toString() === postToUpdate.user.toString()) {
    const post = {
      content: body.content,
    };

    const updatedBlog = await Post.findByIdAndUpdate(req.params.id, post, {
      new: true,
    });
    res.json(updatedBlog);
  } else {
    res.status(403).json({ error: "invalid credentials" });
  }
});

postsRouter.put(
  "/:id/like",
  userExtractor,
  async (req: RequestWithUser, res) => {
    const user = req.user;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }

    const hasLiked = post.likedBy.some(
      (userId) => userId.toString() === user.id.toString()
    );

    if (hasLiked) {
      post.likes -= 1;
      post.likedBy = post.likedBy.filter(
        (userId) => userId.toString() !== user.id.toString()
      );
    } else {
      post.likes += 1;
      post.likedBy.push(user.id);
      io.to(post.user.toString()).emit("notification", {
        message: `Your post with ${post.content}... has been liked by ${user.username}`,
        postId: post.id,
        likedBy: user.id,
      });
      console.log(post.user);
    }

    const updatedPost = await post.save();
    return res.json(updatedPost);
  }
);

postsRouter.post(
  "/:id/comment",
  userExtractor,
  async (req: RequestWithUser, res) => {
    const body = req.body;
    const user = req.user;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }
    const comment = {
      text: body.text,
      username: user.username,
      name: user.name,
      id: user.id,
    };
    post.comments.push(comment);
    io.to(post.user.toString()).emit("notification", {
      message: `${user.username} has commented on your post: ${post.content}...`,
      postId: post.id,
    });

    await post.save();
    return res.status(201).json(body.comment);
  }
);

export default postsRouter;
