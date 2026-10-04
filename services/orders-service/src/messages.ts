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

function isWithinOneEdit(source: string, candidate: string): boolean {
  if (source === candidate) return true;
  if (Math.abs(source.length - candidate.length) > 1) return false;

  if (source.length === candidate.length) {
    let mismatch = -1;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] === candidate[index]) continue;
      if (mismatch !== -1) {
        return (
          index === mismatch + 1 &&
          source[mismatch] === candidate[index] &&
          source[index] === candidate[mismatch] &&
          source.slice(index + 1) === candidate.slice(index + 1)
        );
      }
      mismatch = index;
    }
    return mismatch !== -1;
  }

  const longer = source.length > candidate.length ? source : candidate;
  const shorter = source.length > candidate.length ? candidate : source;
  let longIndex = 0;
  let shortIndex = 0;
  let skipped = false;

  while (longIndex < longer.length && shortIndex < shorter.length) {
    if (longer[longIndex] === shorter[shortIndex]) {
      longIndex += 1;
      shortIndex += 1;
    } else if (skipped) {
      return false;
    } else {
      skipped = true;
      longIndex += 1;
    }
  }

  return true;
}

export function findMatchedNode(text: string): MessageNode | undefined {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return undefined;

  const orderedNodes = Object.values(MESSAGE_TREE).sort((a, b) =>
    Number(a.key === "root") - Number(b.key === "root"),
  );

  for (const node of orderedNodes) {
    const matches = node.keywords.some((keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalized.includes(normalizedKeyword)) return true;
      if (normalizedKeyword.length < 5 || normalizedKeyword.includes(" ")) {
        return false;
      }

      const words = normalized.match(/[a-z0-9]+/g) ?? [];
      return words.some((word) => isWithinOneEdit(normalizedKeyword, word));
    });
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
