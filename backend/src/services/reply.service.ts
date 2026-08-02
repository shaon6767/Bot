import { IProduct } from "../models/Product.js";

export interface ParsedOrderItem {
  product: IProduct;
  quantity: number;
}

export interface ReplyResult {
  understood: boolean;
  replyText?: string;
  orderItems?: ParsedOrderItem[];
}

const MENU_KEYWORDS = ["menu", "products", "price", "prices", "list"];
const GREETING_KEYWORDS = ["hi", "hello", "hey"];

function hasWord(normalized: string, words: string[]): boolean {
  const tokens = normalized.split(/[^a-z0-9]+/i).filter(Boolean);
  return words.some((w) => tokens.includes(w));
}

const OFF_TOPIC_PATTERNS = [
  // Bot/AI identity — never let this reach the model
  /\bwho (are|r) (you|u)\b/i,
  /\bwhat are you\b/i,
  /\bare you (an? )?(ai|bot|robot|human|real)\b/i,
  /\bwhich (ai|model|llm)\b/i,
  /\b(chatgpt|openai|gemini|grok|claude|anthropic)\b/i,
  /\bwho (made|built|created|trained|owns) (you|this bot|this app|it)\b/i,

  // Prompt injection / jailbreak attempts
  /\bignore (all )?(previous|above|prior) (instructions|messages|prompt)\b/i,
  /\bsystem prompt\b/i,
  /\byou are now\b/i,
  /\back as\b/i,
  /\bpretend (you are|to be)\b/i,
  /\bforget (your|all) (instructions|rules)\b/i,

  // Generic off-topic requests
  /\btell me a joke\b/i,
  /\bwrite (me )?a (poem|song|story|essay)\b/i,
  /\bwhat('s| is) the weather\b/i,
  /\btranslate this\b/i,
  /\bwho is the (prime minister|president)\b/i,
  /\bwhat('s| is) the capital of\b/i,
  /\bsolve (this|the) (equation|problem)\b/i,
];

function looksLikeSpamOrJunk(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length > 500) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^(.)\1{6,}$/.test(trimmed.replace(/\s/g, ""))) return true;
  if (!/[a-zA-Z\u0980-\u09FF0-9]/.test(trimmed)) return true; // no letters/digits at all — \u0980-\u09FF covers Bangla script
  return false;
}

// Runs BEFORE the LLM is ever called — catches obvious junk cheaply so it never burns LLM quota
export function isLikelyOffTopic(text: string): boolean {
  if (looksLikeSpamOrJunk(text)) return true;
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}

export function processMessage(
  text: string,
  products: IProduct[],
): ReplyResult {
  const normalized = text.trim().toLowerCase();

  if (normalized.startsWith("order ")) {
    return parseOrder(normalized, products);
  }

  if (hasWord(normalized, MENU_KEYWORDS)) {
    return { understood: true, replyText: buildMenuText(products) };
  }

  if (hasWord(normalized, GREETING_KEYWORDS)) {
    return {
      understood: true,
      replyText: `Hi! Type "menu" to see our products, or "order <product name> <quantity>" to order.`,
    };
  }

  return { understood: false };
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
      understood: true,
      replyText: `To order, type: order <product name> <quantity>. Example: order t-shirt 2`,
    };
  }

  const [, rawName, rawQty] = match;
  const quantity = parseInt(rawQty, 10);
  const product = products.find((p) => p.name.toLowerCase() === rawName.trim());

  if (!product) {
    return {
      understood: true,
      replyText: `Couldn't find "${rawName.trim()}" in our menu. Type "menu" to see available products.`,
    };
  }

  return {
    understood: true,
    replyText: `Got it! ${quantity} x ${product.name} = ${product.price * quantity} BDT. We'll confirm shortly.`,
    orderItems: [{ product, quantity }],
  };
}
