import { Schema, model } from "mongoose";
const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
const orderSchema = new Schema({
    businessId: {
        type: Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
    },
    channel: { type: String, enum: ["messenger", "instagram"], required: true },
    customerId: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["new", "confirmed", "shipped", "cancelled"],
        default: "new",
        index: true,
    },
}, { timestamps: true });
export const Order = model("Order", orderSchema);
