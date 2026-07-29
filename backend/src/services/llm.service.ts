import { env } from "../config/env";
import { IProduct } from "../models/Product";
import { logger } from "../utils/logger";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GROK_URL = "https://api.x.ai/v1/chat/completions";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

interface GrokResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function buildPrompt(customerMessage: string, products: IProduct[]): string {
  const catalog = products.length
    ? products.map((p) => `${p.name}: ${p.price} BDT`).join("\n")
    : "No products currently listed.";

  return [
    "You are replying to a customer in a Facebook/Instagram chat for a small online shop in Bangladesh.",
    "Only answer using the product list below. Never invent a product, price, or policy that is not listed here.",
    "If the question is about something not covered here (delivery time, returns, payment method, etc.), say a team member will confirm shortly — do not guess.",
    "Match the customer's language and tone (Bangla, Banglish, or English). Keep the reply short, 1-2 sentences, like a real chat message.",
    "",
    "Product list:",
    catalog,
    "",
    `Customer message: "${customerMessage}"`,
  ].join("\n");
}

async function callGemini(prompt: string): Promise<string> {
  if (!env.geminiApiKey) throw new Error("No Gemini API key configured");

  const response = await fetch(`${GEMINI_URL}?key=${env.geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Gemini returned no usable text");
  return text.trim();
}

async function callGrok(prompt: string): Promise<string> {
  if (!env.grokApiKey) throw new Error("No Grok API key configured");

  const response = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.grokApiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.1-fast",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok request failed: ${response.status}`);
  }

  const data = (await response.json()) as GrokResponse;
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error("Grok returned no usable text");
  return text.trim();
}

export async function generateSmartReply(
  customerMessage: string,
  products: IProduct[],
): Promise<string | null> {
  const prompt = buildPrompt(customerMessage, products);

  try {
    return await callGemini(prompt);
  } catch (err) {
    logger.warn("Gemini failed, falling back to Grok", err);
  }

  try {
    return await callGrok(prompt);
  } catch (err) {
    logger.error("Grok failed too — no LLM reply available", err);
  }

  return null;
}
