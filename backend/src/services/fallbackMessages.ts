export const UNKNOWN_TEXT_FALLBACK_MESSAGE =
  'Sorry, I didn\'t understand that. Please choose an option below, or type "menu" to see our products.';
export const SERVICE_UNAVAILABLE_FALLBACK_MESSAGE =
  "Sorry, I can't load that right now. Please try again in a moment.";
export const ATTACHMENT_FALLBACK_MESSAGE =
  "Thanks for sharing! I can only read text and buttons. Please choose an option below.";
export const UNKNOWN_PAYLOAD_FALLBACK_MESSAGE =
  'Sorry, I didn\'t understand that. Please choose an option below, or type "menu" to see our products.';

export type FallbackKind =
  | "unknown-text"
  | "service-unavailable"
  | "attachment"
  | "unknown-payload";

export function selectFallback(kind: FallbackKind): string {
  switch (kind) {
    case "unknown-text":
      return UNKNOWN_TEXT_FALLBACK_MESSAGE;
    case "service-unavailable":
      return SERVICE_UNAVAILABLE_FALLBACK_MESSAGE;
    case "attachment":
      return ATTACHMENT_FALLBACK_MESSAGE;
    case "unknown-payload":
      return UNKNOWN_PAYLOAD_FALLBACK_MESSAGE;
  }
}
