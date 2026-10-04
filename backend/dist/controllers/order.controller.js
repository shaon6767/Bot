import { Order } from "../models/Order.js";
export async function getOrders(req, res) {
    const { status } = req.query;
    const filter = { businessId: req.businessId };
    if (status)
        filter.status = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
}
export async function updateOrderStatus(req, res) {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate({ _id: req.params.id, businessId: req.businessId }, { status }, { new: true });
    if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
    }
    res.json(order);
}
