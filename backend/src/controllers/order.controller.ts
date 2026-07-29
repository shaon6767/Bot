import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Order } from "../models/Order";

export async function getOrders(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { status } = req.query;

  const filter: Record<string, unknown> = { businessId: req.businessId };
  if (status) filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
}

export async function updateOrderStatus(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { status } = req.body;
  const validStatuses = ["new", "confirmed", "shipped", "cancelled"];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, businessId: req.businessId },
    { status },
    { new: true },
  );

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json(order);
}
