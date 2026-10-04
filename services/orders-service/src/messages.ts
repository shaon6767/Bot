export type QuickReplyNode = {
  title: string;
  payload: string;
  nextKey: string;
};

export type MessageNode = {
  key: string;
  text: string;
  keywords: string[];
  options?: QuickReplyNode[];
};

export const MESSAGE_TREE: Record<string, MessageNode> = {
  root: {
    key: "root",
    text: "Hello {{shop_name}}! How can I help with your order today?",
    keywords: ["order", "delivery", "returns", "track", "status", "shipment"],
    options: [
      { title: "Delivery", payload: "ORD_DELIVERY", nextKey: "delivery" },
      { title: "Track order", payload: "ORD_TRACK", nextKey: "track" },
      { title: "Returns", payload: "ORD_RETURNS", nextKey: "returns" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  delivery: {
    key: "delivery",
    text: "Delivery times vary by location. [EDIT: delivery time]",
    keywords: ["delivery", "shipping", "arrive", "time"],
    options: [
      { title: "Track order", payload: "ORD_TRACK", nextKey: "track" },
      { title: "Returns", payload: "ORD_RETURNS", nextKey: "returns" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  track: {
    key: "track",
    text: "Use your order number to track status. [EDIT: tracking instructions]",
    keywords: ["track", "status", "shipment", "order number"],
    options: [
      { title: "Delivery", payload: "ORD_DELIVERY", nextKey: "delivery" },
      { title: "Returns", payload: "ORD_RETURNS", nextKey: "returns" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  returns: {
    key: "returns",
    text: "We can help with exchange or returns. [EDIT: return window]",
    keywords: ["return", "exchange", "refund"],
    options: [
      { title: "Delivery", payload: "ORD_DELIVERY", nextKey: "delivery" },
      { title: "Track order", payload: "ORD_TRACK", nextKey: "track" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
};

export function findMatchedNode(text: string): MessageNode | undefined {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return undefined;

  const orderedNodes = Object.values(MESSAGE_TREE).sort((a, b) =>
    Number(a.key === "root") - Number(b.key === "root"),
  );

  for (const node of orderedNodes) {
    const matches = node.keywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    );
    if (matches) return node;
  }

  return undefined;
}

export function resolvePayloadNode(payload?: string): MessageNode | undefined {
  if (!payload) return undefined;
  const key = payload.toLowerCase();
  if (key.includes("delivery")) return MESSAGE_TREE.delivery;
  if (key.includes("track")) return MESSAGE_TREE.track;
  if (key.includes("return")) return MESSAGE_TREE.returns;
  return MESSAGE_TREE.root;
}
