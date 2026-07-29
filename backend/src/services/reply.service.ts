import { IProduct } from "../models/Product";

export interface ParsedOrderItem {
  product: IProduct;
  quantity: number;
}

export interface ReplyResult {
  replyText: string;
  orderItems?: ParsedOrderItem[];
}

const MENU_KEYWORDS = ["menu", "products", "price", "prices", "list"];
const GREETING_KEYWORDS = ["hi", "hello", "hey"];

export function processMessage(
  text: string,
  products: IProduct[],
): ReplyResult {
  const normalized = text.trim().toLowerCase();

  if (normalized.startsWith("order ")) {
    return parseOrder(normalized, products);
  }

  if (MENU_KEYWORDS.some((k) => normalized.includes(k))) {
    return { replyText: buildMenuText(products) };
  }

  if (GREETING_KEYWORDS.some((k) => normalized.includes(k))) {
    return {
      replyText: `Hi! Type "menu" to see our products, or "order <product name> <quantity>" to order.`,
    };
  }

  return {
    replyText: `Sorry, I didn't catch that. Type "menu" to see our products.`,
  };
}

function buildMenuText(products: IProduct[]): string {
  if (products.length === 0) return "No products available right now.";
  const lines = products.map((p) => `- ${p.name}: ${p.price} BDT`);
  return `Here's what we have:\n${lines.join("\n")}`;
}

function parseOrder(normalized: string, products: IProduct[]): ReplyResult {
  const withoutCommand = normalized.replace(/^order\s+/, "");
  const match = withoutCommand.match(/^(.+?)\s+(\d+)$/);

  if (!match) {
    return {
      replyText: `To order, type: order <product name> <quantity>. Example: order t-shirt 2`,
    };
  }

  const [, rawName, rawQty] = match;
  const quantity = parseInt(rawQty, 10);
  const product = products.find((p) => p.name.toLowerCase() === rawName.trim());

  if (!product) {
    return {
      replyText: `Couldn't find "${rawName.trim()}" in our menu. Type "menu" to see available products.`,
    };
  }

  return {
    replyText: `Got it! ${quantity} x ${product.name} = ${product.price * quantity} BDT. We'll confirm shortly.`,
    orderItems: [{ product, quantity }],
  };
}
