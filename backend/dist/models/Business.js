import { Schema, model } from "mongoose";
const businessSchema = new Schema({
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
}, { timestamps: true });
export const Business = model("Business", businessSchema);
