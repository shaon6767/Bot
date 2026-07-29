import { Request, Response } from "express";
import { instagramAdapter } from "../adapters/instagramAdapter.js";
import { messengerAdapter } from "../adapters/messengerAdapter.js";
import { env } from "../config/env.js";
import { MetaWebhookRequest } from "../middleware/verifyMetaSignature.js";
import { handleIncomingMessage } from "../services/conversation.service.js";
import { logger } from "../utils/logger.js";

export function handleWebhookGet(req: Request, res: Response): void {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.metaVerifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
}

export function handleWebhookPost(
  req: MetaWebhookRequest,
  res: Response,
): void {
  res.sendStatus(200); // acknowledge immediately — Meta retries if we're slow

  const body = req.parsedBody;
  if (!body || !Array.isArray(body.entry)) return;

  const channel = body.object === "instagram" ? "instagram" : "messenger";
  const adapter = channel === "instagram" ? instagramAdapter : messengerAdapter;

  for (const entry of body.entry) {
    const messages = adapter.parseEntry(entry);
    for (const msg of messages) {
      handleIncomingMessage(msg).catch((err) =>
        logger.error("Failed to handle message", err),
      );
    }
  }
}
