import { Types } from "mongoose";
import { IOrder, Order } from "../models/Order.js";
import { ParsedOrderItem } from "./reply.service.js";

export async function createOrder(
  businessId: Types.ObjectId,
  channel: "messenger" | "instagram",
  customerId: string,
  items: ParsedOrderItem[],
): Promise<IOrder> {
  const orderItems = items.map((i) => ({
    productId: i.product._id,
    name: i.product.name,
    price: i.product.price,
    quantity: i.quantity,
  }));

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return Order.create({
    businessId,
    channel,
    customerId,
    items: orderItems,
    total,
    status: "new",
  });
}
