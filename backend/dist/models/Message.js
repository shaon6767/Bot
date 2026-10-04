import { Schema, model } from "mongoose";
const messageSchema = new Schema({
    businessId: {
        type: Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
    },
    channel: { type: String, enum: ["messenger", "instagram"], required: true },
    customerId: { type: String, required: true, index: true },
    metaMessageId: { type: String, required: true, unique: true },
    sender: {
        type: String,
        enum: ["customer", "bot", "owner"],
        required: true,
    },
    text: { type: String, required: true },
}, { timestamps: true });
export const Message = model("Message", messageSchema);
