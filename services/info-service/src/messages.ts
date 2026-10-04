export type MessageNode = {
  key: string;
  text: string;
  keywords: string[];
  options?: Array<{ title: string; payload: string; nextKey: string }>;
};

export const MESSAGE_TREE: Record<string, MessageNode> = {
  root: {
    key: "root",
    text: "Hello {{shop_name}}! How can I help?",
    keywords: ["payment", "contact", "hours", "business", "about", "location"],
    options: [
      { title: "Payment", payload: "INFO_PAYMENT", nextKey: "payment" },
      { title: "Contact", payload: "INFO_CONTACT", nextKey: "contact" },
      { title: "Hours", payload: "INFO_HOURS", nextKey: "hours" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  payment: {
    key: "payment",
    text: "We accept common methods. [EDIT: payment methods]",
    keywords: ["payment", "card", "cash", "method"],
    options: [
      { title: "Contact", payload: "INFO_CONTACT", nextKey: "contact" },
      { title: "Hours", payload: "INFO_HOURS", nextKey: "hours" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  contact: {
    key: "contact",
    text: "Please contact us through the channel in use. [EDIT: contact method]",
    keywords: ["contact", "email", "phone", "support"],
    options: [
      { title: "Payment", payload: "INFO_PAYMENT", nextKey: "payment" },
      { title: "Hours", payload: "INFO_HOURS", nextKey: "hours" },
      { title: "Main menu", payload: "MAIN_MENU", nextKey: "root" },
    ],
  },
  hours: {
    key: "hours",
    text: "Our hours may vary by channel. [EDIT: opening hours]",
    keywords: ["hours", "open", "time", "working"],
    options: [
      { title: "Payment", payload: "INFO_PAYMENT", nextKey: "payment" },
      { title: "Contact", payload: "INFO_CONTACT", nextKey: "contact" },
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
    if (node.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return node;
    }
  }

  return undefined;
}

export function resolvePayloadNode(payload?: string): MessageNode | undefined {
  if (!payload) return undefined;
  const normalized = payload.toLowerCase();
  if (normalized.includes("payment")) return MESSAGE_TREE.payment;
  if (normalized.includes("contact")) return MESSAGE_TREE.contact;
  if (normalized.includes("hours")) return MESSAGE_TREE.hours;
  return MESSAGE_TREE.root;
}
