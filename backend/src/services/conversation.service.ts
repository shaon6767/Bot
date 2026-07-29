import { instagramAdapter } from "../adapters/instagramAdapter";
import { messengerAdapter } from "../adapters/messengerAdapter";
import { Business } from "../models/Business";
import { Message } from "../models/Message";
import { Product } from "../models/Product";
import { IncomingMessage } from "../types";
import { logger } from "../utils/logger";
import { createOrder } from "./order.service";
import { processMessage } from "./reply.service";

export async function handleIncomingMessage(
  msg: IncomingMessage,
): Promise<void> {
  const business = await Business.findOne({
    $or: [{ pageId: msg.pageId }, { instagramAccountId: msg.pageId }],
  }).select("+pageAccessToken");

  if (!business) {
    logger.warn(`No business found for pageId ${msg.pageId}`);
    return;
  }

  try {
    await Message.create({
      businessId: business._id,
      channel: msg.channel,
      customerId: msg.senderId,
      metaMessageId: msg.metaMessageId,
      sender: "customer",
      text: msg.text,
    });
  } catch (err: any) {
    if (err.code === 11000) return; // duplicate webhook delivery, already handled
    throw err;
  }

  const products = await Product.find({ businessId: business._id });
  const result = processMessage(msg.text, products);

  if (result.orderItems?.length) {
    await createOrder(
      business._id,
      msg.channel,
      msg.senderId,
      result.orderItems,
    );
  }

  if (!business.pageAccessToken) {
    logger.error(`Business ${business._id} has no pageAccessToken configured`);
    return;
  }

  const adapter =
    msg.channel === "instagram" ? instagramAdapter : messengerAdapter;
  await adapter.sendMessage(
    business.pageAccessToken,
    msg.senderId,
    result.replyText,
  );

  await Message.create({
    businessId: business._id,
    channel: msg.channel,
    customerId: msg.senderId,
    metaMessageId: `bot-${msg.metaMessageId}`,
    sender: "bot",
    text: result.replyText,
  });
}
