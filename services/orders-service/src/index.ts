import { randomUUID, timingSafeEqual } from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { z } from "zod";
import { findMatchedNode, MESSAGE_TREE, resolvePayloadNode } from "./messages.js";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

if (!INTERNAL_SERVICE_KEY) {
  console.error("INTERNAL_SERVICE_KEY is required");
  process.exit(1);
}

const requestSchema = z.object({
  payload: z.string().optional(),
  text: z.string().optional(),
  channel: z.enum(["messenger", "instagram"]),
  shopName: z.string().min(1).max(100),
});

const responseSchema = z.object({
  matched: z.boolean(),
  text: z.string().max(2000).optional(),
  quickReplies: z
    .array(
      z.object({
        title: z.string().max(20),
        payload: z.string().max(100),
      }),
    )
    .max(13)
    .optional(),
});

const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
};

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/reply", (req, res) => {
  const requestId = req.header("x-request-id") || randomUUID();
  const startedAt = Date.now();
  const requiredKey = req.header("x-internal-key");
  const providedBuffer = requiredKey ? Buffer.from(requiredKey) : Buffer.alloc(0);
  const expectedBuffer = Buffer.from(INTERNAL_SERVICE_KEY);

  if (
    !requiredKey ||
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    logger.warn("orders-service unauthorized request", { requestId });
    return res.status(401).json({ error: "unauthorized" });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("orders-service invalid request", { requestId });
    return res.status(400).json({ error: "invalid request" });
  }

  const { payload, text, shopName } = parsed.data;
  const reply = resolvePayloadNode(payload) ?? findMatchedNode(text ?? "");

  const matchedNode = reply ?? (payload ? MESSAGE_TREE.root : undefined);
  if (!matchedNode) {
    const duration = Date.now() - startedAt;
    logger.info("orders-service miss", { requestId, route: "/reply", matched: false, duration });
    return res.json({ matched: false });
  }

  const responseText = matchedNode.text.replace(/{{shop_name}}/g, shopName);
  const quickReplies = matchedNode.options?.map((option) => ({
    title: option.title,
    payload: option.payload,
  }));

  const output = responseSchema.parse({
    matched: true,
    text: responseText,
    quickReplies,
  });

  const duration = Date.now() - startedAt;
  logger.info("orders-service hit", { requestId, route: "/reply", matched: true, duration });
  res.json(output);
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("orders-service 500", error);
  res.status(500).json({ error: "internal server error" });
});

const server = app.listen(PORT, () => {
  logger.info(`orders-service listening on ${PORT}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("unhandledRejection", (reason) => {
  logger.error("orders-service unhandledRejection", reason);
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  logger.error("orders-service uncaughtException", error);
  process.exit(1);
});
