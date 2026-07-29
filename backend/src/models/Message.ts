import { Document, Schema, Types, model } from "mongoose";

export type Channel = "messenger" | "instagram";
export type Sender = "customer" | "bot" | "owner";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  channel: Channel;
  customerId: string;
  metaMessageId: string;
  sender: Sender;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
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
  },
  { timestamps: true },
);

export const Message = model<IMessage>("Message", messageSchema);
