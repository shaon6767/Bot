import { Schema, model } from "mongoose";
const productSchema = new Schema({
    businessId: {
        type: Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
}, { timestamps: true });
export const Product = model("Product", productSchema);
