import { Document } from "mongoose";
import { instagramAdapter } from "../adapters/instagramAdapter.js";
import { messengerAdapter } from "../adapters/messengerAdapter.js";
import { Business, IBusiness } from "../models/Business.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { IncomingMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { createOrder } from "./order.service.js";
import { isLikelyOffTopic, processMessage } from "./reply.service.js";

const FALLBACK_MESSAGE =
  "Thanks for your message! We'll get back to you shortly.";
const OFF_TOPIC_MESSAGE =
  "Ask me anything about our products or your order, and I'll help! 🙂";

type Adapter = typeof messengerAdapter | typeof instagramAdapter;

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
    if (err.code === 11000) return;
    throw err;
  }

  if (!business.pageAccessToken) {
    logger.error(`Business ${business._id} has no pageAccessToken configured`);
    return;
  }

  const products = await Product.find({ businessId: business._id });
  const result = processMessage(msg.text, products);
  const adapter =
    msg.channel === "instagram" ? instagramAdapter : messengerAdapter;

  if (result.orderItems?.length) {
    await createOrder(
      business._id,
      msg.channel,
      msg.senderId,
      result.orderItems,
    );
  }

  if (result.understood) {
    await sendAndLog(adapter, business, msg, result.replyText!, "fast");
    return;
  }

  if (isLikelyOffTopic(msg.text)) {
    await sendAndLog(adapter, business, msg, OFF_TOPIC_MESSAGE, "off-topic");
    return; // keep off-topic handling immediate and consistent
  }

  await sendAndLog(
    adapter,
    business,
    msg,
    FALLBACK_MESSAGE,
    "fallback",
  );
}

async function sendAndLog(
  adapter: Adapter,
  business: Document<unknown, {}, IBusiness> & IBusiness,
  msg: IncomingMessage,
  replyText: string,
  idSuffix: string,
): Promise<boolean> {
  try {
    await adapter.sendMessage(
      business.pageAccessToken!,
      msg.senderId,
      replyText,
    );

    await Message.create({
      businessId: business._id,
      channel: msg.channel,
      customerId: msg.senderId,
      metaMessageId: `bot-${msg.metaMessageId}-${idSuffix}`,
      sender: "bot",
      text: replyText,
    });
    return true;
  } catch (err) {
    logger.error(
      `Failed to send/log "${idSuffix}" reply for business ${business._id}, customer ${msg.senderId}`,
      err,
    );
    return false;
  }
}
