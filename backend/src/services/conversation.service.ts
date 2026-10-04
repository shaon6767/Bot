import { Document } from "mongoose";
import { instagramAdapter } from "../adapters/instagramAdapter.js";
import { messengerAdapter } from "../adapters/messengerAdapter.js";
import { Business, IBusiness } from "../models/Business.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { IncomingMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { createOrder } from "./order.service.js";
import {
  FallbackKind,
  selectFallback,
} from "./fallbackMessages.js";
import { getMicroserviceReply } from "./microservice.service.js";
import { isLikelyOffTopic, processMessage } from "./reply.service.js";

const OFF_TOPIC_MESSAGE =
  "Ask me anything about our products or your order, and I'll help! 🙂";
export const MAIN_QUICK_REPLIES = [
  { title: "Products", payload: "ICE_BREAKER_MENU" },
  { title: "Delivery", payload: "ORD_DELIVERY" },
  { title: "Payment", payload: "INFO_PAYMENT" },
  { title: "Contact", payload: "INFO_CONTACT" },
];
export const MAIN_MENU_REPLY_TEXT =
  "How can I help you today? Choose an option below.";

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

    const isServicePayload =
      msg.payload.startsWith("ORD_") || msg.payload.startsWith("INFO_");
    const isKnownPayload =
      msg.payload.startsWith("ICE_BREAKER_") || msg.payload === "MAIN_MENU";

    const microserviceReply = await getMicroserviceReply(
      msg.text,
      msg.channel,
      business.name,
      msg.payload,
    );

    if (microserviceReply?.matched) {
      await sendAndLog(
        adapter,
        business,
        msg,
        microserviceReply.text ?? selectFallback("service-unavailable"),
        "service",
        microserviceReply.quickReplies,
      );
      return;
    }

    const fallbackKind: FallbackKind = isServicePayload
      ? "service-unavailable"
      : isKnownPayload
        ? "unknown-text"
        : "unknown-payload";
    await sendAndLog(
      adapter,
      business,
      msg,
      selectFallback(fallbackKind),
      "fallback",
      MAIN_QUICK_REPLIES,
    );
    return;
  }

  if (msg.text === "[attachment]") {
    await sendAndLog(
      adapter,
      business,
      msg,
      selectFallback("attachment"),
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
    const quickReplies = result.orderItems?.length ? undefined : MAIN_QUICK_REPLIES;
    await sendAndLog(
      adapter,
      business,
      msg,
      result.replyText!,
      "fast",
      quickReplies,
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
      microserviceReply.text ?? selectFallback("service-unavailable"),
      "service",
      microserviceReply.quickReplies,
    );
    return;
  }

  await sendAndLog(
    adapter,
    business,
    msg,
    selectFallback("unknown-text"),
    "fallback",
    MAIN_QUICK_REPLIES,
  );
}

export function getLocalPayloadReply(
  payload: string,
  products: any[],
): { replyText: string } | null {
  switch (payload) {
    case "ICE_BREAKER_GREETING":
      return { replyText: processMessage("hi", products).replyText ?? "Hi!" };
    case "ICE_BREAKER_MENU":
      return { replyText: processMessage("menu", products).replyText ?? "Menu" };
    case "ICE_BREAKER_ORDER_INFO":
      return {
        replyText:
          processMessage("order help", products).replyText ??
          "To order, type: order <product name> <quantity>.",
      };
    case "MAIN_MENU":
      return { replyText: MAIN_MENU_REPLY_TEXT };
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
