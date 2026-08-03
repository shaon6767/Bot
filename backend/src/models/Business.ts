import { Document, Schema, Types, model } from "mongoose";

export interface IBusiness extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  pageAccessToken?: string;
  pageId?: string;
  instagramAccountId?: string;
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    pageAccessToken: { type: String, select: false },
    pageId: { type: String },
    instagramAccountId: { type: String },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true },
);

export const Business = model<IBusiness>("Business", businessSchema);
