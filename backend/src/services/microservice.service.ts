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

const warnedUnconfiguredServices = new Set<"orders" | "info">();

function warnServiceNotConfigured(type: "orders" | "info"): void {
  if (warnedUnconfiguredServices.has(type)) return;
  warnedUnconfiguredServices.add(type);
  logger.warn(`Microservice ${type} URL is not configured`);
}

function getShortErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "UNKNOWN";
  const requestError = error as {
    cause?: unknown;
    code?: unknown;
    name?: unknown;
  };
  const cause =
    requestError.cause && typeof requestError.cause === "object"
      ? (requestError.cause as { code?: unknown }).code
      : undefined;
  const code =
    (typeof cause === "string" && cause) ||
    (typeof requestError.code === "string" && requestError.code) ||
    (typeof requestError.name === "string" && requestError.name) ||
    "UNKNOWN";
  return /^[A-Za-z0-9_-]{1,40}$/.test(code) ? code : "UNKNOWN";
}

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
  } catch (error: unknown) {
    const errorName =
      error && typeof error === "object" && "name" in error
        ? error.name
        : undefined;
    const abortReasonName = signal.reason?.name ?? errorName;
    if (abortReasonName === "TimeoutError") {
      logger.warn(`Microservice ${type} timed out`);
      return null;
    }

    if (abortReasonName === "AbortError") {
      return null;
    }

    logger.warn(
      `Microservice ${type} request failed (${getShortErrorCode(error)})`,
    );
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

    if (!serviceUrl) {
      warnServiceNotConfigured(serviceType);
      return null;
    }

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

  const servicesWithUrls = services
    .map((service) => ({
      ...service,
      url: buildServiceUrl(service.url ?? ""),
    }));

  for (const service of servicesWithUrls) {
    if (!service.url) warnServiceNotConfigured(service.type);
  }

  const validServices = servicesWithUrls.filter(
    (service): service is { type: "orders" | "info"; url: string } =>
      Boolean(service.url),
  );

  if (validServices.length === 0) {
    return null;
  }

  const controllers = new Map<"orders" | "info", AbortController>();

  return new Promise((resolve) => {
    let completed = 0;
    let settled = false;

    const onResult = (
      type: "orders" | "info",
      result: MicroserviceReply | null,
    ) => {
      if (settled) return;

      if (result?.matched) {
        settled = true;
        for (const [otherType, controller] of controllers) {
          if (otherType !== type) controller.abort();
        }
        resolve(result);
        return;
      }

      completed += 1;
      if (completed === validServices.length) {
        settled = true;
        resolve(null);
      }
    };

    for (const service of validServices) {
      const controller = new AbortController();
      controllers.set(service.type, controller);
      void requestMicroservice(
        service.url,
        service.type,
        undefined,
        text,
        channel,
        shopName,
        withTimeout(controller.signal),
      ).then(
        (result) => onResult(service.type, result),
        () => onResult(service.type, null),
      );
    }
  });
}
