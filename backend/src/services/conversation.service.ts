import { Document } from "mongoose";
import { instagramAdapter } from "../adapters/instagramAdapter.js";
import { messengerAdapter } from "../adapters/messengerAdapter.js";
import { Business, IBusiness } from "../models/Business.js";
import { Message } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { IncomingMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { generateSmartReply } from "./llm.service.js";
import { createOrder } from "./order.service.js";
import { processMessage } from "./reply.service.js";

const WAITING_MESSAGE = "Let me check on that for you, one moment...";
const LLM_FALLBACK_MESSAGE =
  "Thanks for your message! We'll get back to you shortly.";

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
    if (err.code === 11000) return; // duplicate webhook delivery, already handled
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

  const waitingSent = await sendAndLog(
    adapter,
    business,
    msg,
    WAITING_MESSAGE,
    "waiting",
  );
  if (!waitingSent) return; // sending already failing — page token is likely broken, don't bother calling the LLM

  const smartReply = await generateSmartReply(msg.text, products);
  await sendAndLog(
    adapter,
    business,
    msg,
    smartReply ?? LLM_FALLBACK_MESSAGE,
    "llm",
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
