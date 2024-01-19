import mongoose from "mongoose";
import { PostInterface } from "../types";

const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model<PostInterface>("Post", PostSchema);
