import { Document, Schema, Types, model } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  price: number;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const Product = model<IProduct>("Product", productSchema);
