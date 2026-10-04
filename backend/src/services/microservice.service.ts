import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const QuickReplySchema = z.object({
  title: z.string().max(20),
  payload: z.string().max(100),
});

export const MicroserviceReplySchema = z.object({
  matched: z.boolean(),
  text: z.string().max(2000).optional(),
  quickReplies: z.array(QuickReplySchema).max(13).optional(),
});

export type MicroserviceReply = z.infer<typeof MicroserviceReplySchema>;

function buildServiceUrl(baseUrl: string): string | null {
  const trimmed = baseUrl.trim();
  if (!trimmed) return null;
  const withoutSlash = trimmed.replace(/\/+$/, "");
  return withoutSlash.endsWith("/reply") ? withoutSlash : `${withoutSlash}/reply`;
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  const requestTimeout = AbortSignal.timeout(3000);
  if (!signal) return requestTimeout;

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, requestTimeout]);
  }

  const controller = new AbortController();
  const stop = () => controller.abort();
  signal.addEventListener("abort", stop, { once: true });
  requestTimeout.addEventListener("abort", stop, { once: true });
  return controller.signal;
}

async function requestMicroservice(
  serviceUrl: string,
  type: "orders" | "info",
  payload: string | undefined,
  text: string,
  channel: "messenger" | "instagram",
  shopName: string,
  signal: AbortSignal,
): Promise<MicroserviceReply | null> {
  const requestId = randomUUID();

  try {
    const response = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": env.internalServiceKey ?? "",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        payload,
        text,
        channel,
        shopName,
      }),
      signal,
    });

    if (!response.ok) {
      try {
        if (response.body && typeof response.body.cancel === "function") {
          await response.body.cancel();
        }
      } catch {
        // ignore body-cancel errors; do not log the body or the key
      }
      logger.warn(
        `Microservice ${type} returned non-OK status ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    const result = MicroserviceReplySchema.safeParse(data);
    if (!result.success) {
      logger.warn(`Microservice ${type} returned invalid payload`);
      return null;
    }

    return result.data;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      logger.warn(`Microservice ${type} timed out or was cancelled`);
      return null;
    }

    logger.warn(`Microservice ${type} request failed`);
    return null;
  }
}

export async function getMicroserviceReply(
  text: string,
  channel: "messenger" | "instagram",
  shopName: string,
  payload?: string,
): Promise<MicroserviceReply | null> {
  const trimmedPayload = payload?.trim();

  if (trimmedPayload) {
    if (!trimmedPayload.startsWith("ORD_") && !trimmedPayload.startsWith("INFO_")) {
      return null;
    }

    const serviceType = trimmedPayload.startsWith("ORD_") ? "orders" : "info";
    const configuredUrl =
      serviceType === "orders" ? env.ordersServiceUrl : env.infoServiceUrl;
    const serviceUrl = configuredUrl ? buildServiceUrl(configuredUrl) : null;

    if (!serviceUrl) return null;

    const controller = new AbortController();
    try {
      return await requestMicroservice(
        serviceUrl,
        serviceType,
        trimmedPayload,
        text,
        channel,
        shopName,
        withTimeout(controller.signal),
      );
    } finally {
      controller.abort();
    }
  }

  const services: Array<{ type: "orders" | "info"; url?: string }> = [
    { type: "orders", url: env.ordersServiceUrl },
    { type: "info", url: env.infoServiceUrl },
  ];

  const validServices = services
    .map((service) => ({
      ...service,
      url: buildServiceUrl(service.url ?? ""),
    }))
    .filter((service): service is { type: "orders" | "info"; url: string } =>
      Boolean(service.url),
    );

  if (validServices.length === 0) {
    return null;
  }

  const orderController = new AbortController();
  const infoController = new AbortController();
  const orderSignal = withTimeout(orderController.signal);
  const infoSignal = withTimeout(infoController.signal);

  try {
    const orderPromise = validServices.some((service) => service.type === "orders")
      ? requestMicroservice(
          validServices.find((service) => service.type === "orders")!.url,
          "orders",
          undefined,
          text,
          channel,
          shopName,
          orderSignal,
        )
      : Promise.resolve(null);

    const infoPromise = validServices.some((service) => service.type === "info")
      ? requestMicroservice(
          validServices.find((service) => service.type === "info")!.url,
          "info",
          undefined,
          text,
          channel,
          shopName,
          infoSignal,
        )
      : Promise.resolve(null);

    const results = await Promise.allSettled([orderPromise, infoPromise]);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.matched) {
        return result.value;
      }
    }

    return null;
  } finally {
    orderController.abort();
    infoController.abort();
  }
}
