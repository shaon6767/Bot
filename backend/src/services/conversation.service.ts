import { Document } from "mongoose";
import { instagramAdapter } from "../adapters/instagramAdapter.js";
import { messengerAdapter } from "../adapters/messengerAdapter.js";
import { Business, IBusiness } from "../models/Business.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { IncomingMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { createOrder } from "./order.service.js";
import { getMicroserviceReply } from "./microservice.service.js";
import { isLikelyOffTopic, processMessage } from "./reply.service.js";

const FALLBACK_MESSAGE =
  "Thanks for your message! We'll get back to you shortly.";
const OFF_TOPIC_MESSAGE =
  "Ask me anything about our products or your order, and I'll help! 🙂";
const MAIN_QUICK_REPLIES = [
  { title: "Delivery", payload: "ORD_DELIVERY" },
  { title: "Returns", payload: "ORD_RETURNS" },
  { title: "Payment", payload: "INFO_PAYMENT" },
  { title: "Main menu", payload: "MAIN_MENU" },
];

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
  const adapter =
    msg.channel === "instagram" ? instagramAdapter : messengerAdapter;

  if (msg.payload) {
    const localReply = getLocalPayloadReply(msg.payload, products);
    if (localReply) {
      await sendAndLog(
        adapter,
        business,
        msg,
        localReply.replyText,
        "fast",
        MAIN_QUICK_REPLIES,
      );
      return;
    }

    await sendAndLog(
      adapter,
      business,
      msg,
      FALLBACK_MESSAGE,
      "fallback",
      MAIN_QUICK_REPLIES,
    );
    return;
  }

  const result = processMessage(msg.text, products);

  if (result.orderItems?.length) {
    await createOrder(
      business._id,
      msg.channel,
      msg.senderId,
      result.orderItems,
    );
  }

  if (result.understood) {
    await sendAndLog(
      adapter,
      business,
      msg,
      result.replyText!,
      "fast",
      MAIN_QUICK_REPLIES,
    );
    return;
  }

  if (isLikelyOffTopic(msg.text)) {
    await sendAndLog(adapter, business, msg, OFF_TOPIC_MESSAGE, "off-topic");
    return;
  }

  const microserviceReply = await getMicroserviceReply(
    msg.text,
    msg.channel,
    business.name,
  );

  if (microserviceReply?.matched) {
    await sendAndLog(
      adapter,
      business,
      msg,
      microserviceReply.text ?? FALLBACK_MESSAGE,
      "service",
      microserviceReply.quickReplies,
    );
    return;
  }

  await sendAndLog(
    adapter,
    business,
    msg,
    FALLBACK_MESSAGE,
    "fallback",
    MAIN_QUICK_REPLIES,
  );
}

function getLocalPayloadReply(
  payload: string,
  products: any[],
): { replyText: string } | null {
  switch (payload) {
    case "ICE_BREAKER_GREETING":
      return { replyText: processMessage("hi", products).replyText ?? "Hi!" };
    case "ICE_BREAKER_MENU":
      return { replyText: processMessage("menu", products).replyText ?? "Menu" };
    case "ICE_BREAKER_ORDER_INFO": {
      const productName = products[0]?.name ?? "product";
      return {
        replyText:
          processMessage(`order ${productName} 1`, products).replyText ??
          "To order, type: order <product name> <quantity>.",
      };
    }
    case "MAIN_MENU":
      return { replyText: processMessage("menu", products).replyText ?? "Menu" };
    default:
      return null;
  }
}

async function sendAndLog(
  adapter: Adapter,
  business: Document<unknown, {}, IBusiness> & IBusiness,
  msg: IncomingMessage,
  replyText: string,
  idSuffix: string,
  quickReplies?: Array<{ title: string; payload: string }>,
): Promise<boolean> {
  try {
    await adapter.sendMessage(
      business.pageAccessToken!,
      msg.senderId,
      replyText,
      quickReplies,
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
