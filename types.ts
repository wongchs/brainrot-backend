import { Schema, Document } from "mongoose";

export interface UserInterface extends Document {
  username: string;
  name: string;
  passwordHash: string;
  posts: Schema.Types.ObjectId[];
}

export interface PostInterface extends Document {
  content: string;
  user: Schema.Types.ObjectId;
}
