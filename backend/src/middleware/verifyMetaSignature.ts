import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
export interface MetaWebhookRequest extends Request {
  parsedBody?: any;
}

export function verifyMetaSignature(
  req: MetaWebhookRequest,
  res: Response,
  next: NextFunction,
) {
  const signature = req.header("x-hub-signature-256");

  if (!signature) {
    res.sendStatus(401);
    return;
  }

  const rawBody = req.body as Buffer;

  const expectedHash = crypto
    .createHmac("sha256", env.metaAppSecret)
    .update(rawBody)
    .digest("hex");

  const expectedSignature = `sha256=${expectedHash}`;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    res.sendStatus(401);
    return;
  }

  req.parsedBody = JSON.parse(rawBody.toString("utf8"));
  next();
}
