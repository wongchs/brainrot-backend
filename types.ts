import { Request } from "express";
import { Schema, Document } from "mongoose";

export interface UserInterface extends Document {
  username: string;
  name: string;
  passwordHash: string;
  posts: Schema.Types.ObjectId[];
}

export interface CommentInterface {
  text: string;
  username: string;
  name: string;
  id: string;
}

export interface PostInterface extends Document {
  content: string;
  user: Schema.Types.ObjectId;
  likes: number;
  likedBy: Schema.Types.ObjectId[];
  comments: CommentInterface[];
}

export interface RequestWithUser extends Request {
  user: UserInterface;
  token: string;
}
