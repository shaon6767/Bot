import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}
