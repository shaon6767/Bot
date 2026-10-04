import { Order } from "../models/Order.js";
export async function createOrder(businessId, channel, customerId, items) {
    const orderItems = items.map((i) => ({
        productId: i.product._id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
    }));
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Order.create({
        businessId,
        channel,
        customerId,
        items: orderItems,
        total,
        status: "new",
    });
}
