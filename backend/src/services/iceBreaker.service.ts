import { logger } from "../utils/logger.js";

const MESSENGER_PROFILE_URL =
  "https://graph.facebook.com/v25.0/me/messenger_profile";

// Worded to match the existing fast-path keywords in reply.service.ts —
// every tap lands on an instant, zero-LLM-cost reply.
const DEFAULT_ICE_BREAKERS = [
  { question: "Hi 👋", payload: "ICE_BREAKER_GREETING" },
  { question: "See our products", payload: "ICE_BREAKER_MENU" },
  { question: "Order info", payload: "ICE_BREAKER_ORDER_INFO" },
];

export async function setIceBreakers(
  pageAccessToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${MESSENGER_PROFILE_URL}?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ice_breakers: DEFAULT_ICE_BREAKERS }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        `Failed to set ice breakers: ${response.status} ${errorBody}`,
      );
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Error setting ice breakers", err);
    return false;
  }
}
