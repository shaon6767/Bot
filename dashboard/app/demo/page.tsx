"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  RotateCcw,
  Send,
  ShoppingBag,
} from "lucide-react";
import { InstagramIcon } from "@/components/InstagramIcon";
import { FormEvent, useEffect, useRef, useState } from "react";

type Channel = "messenger" | "instagram";
type Message = {
  id: number;
  sender: "customer" | "assistant";
  text: string;
  quickReplies?: string[];
};

const QUICK_REPLIES = ["Products", "Delivery", "Payment", "Contact"];
const PRODUCTS = [
  { name: "Canvas tote", price: 650 },
  { name: "Ceramic mug", price: 450 },
  { name: "Linen notebook", price: 320 },
];

function getInitialMessages(): Message[] {
  return [
    {
      id: 1,
      sender: "assistant",
      text: "Hi there! Welcome to Willow & Thread. How can I help you today?",
    },
    {
      id: 2,
      sender: "customer",
      text: "Show me your products",
    },
    {
      id: 3,
      sender: "assistant",
      text: `Here's what we have:\n${PRODUCTS.map(
        (product) => `• ${product.name}: ${product.price} BDT`,
      ).join("\n")}\n\nTo order, type: order <product name> <quantity>\nExample: order canvas tote 2`,
      quickReplies: QUICK_REPLIES,
    },
  ];
}

function getReply(text: string): { text: string; quickReplies?: string[] } {
  const normalized = text.trim().toLowerCase();

  if (
    normalized === "menu" ||
    normalized === "list" ||
    normalized === "products" ||
    normalized.includes("show me") ||
    normalized.includes("catalog")
  ) {
    return {
      text: `Here's what we have:\n${PRODUCTS.map(
        (product) => `• ${product.name}: ${product.price} BDT`,
      ).join("\n")}\n\nTo order, type: order <product name> <quantity>\nExample: order canvas tote 2`,
      quickReplies: QUICK_REPLIES,
    };
  }

  if (normalized.startsWith("order ")) {
    const match = normalized.match(/^order\s+(.+?)\s+(\d+)$/);
    if (!match) {
      return {
        text: "To order, type: order <product name> <quantity>. Example: order canvas tote 2",
        quickReplies: QUICK_REPLIES,
      };
    }

    const [, requestedName, rawQuantity] = match;
    const product = PRODUCTS.find(
      (candidate) => candidate.name.toLowerCase() === requestedName.trim(),
    );
    if (!product) {
      return {
        text: `Couldn't find "${requestedName.trim()}" in our menu. Type "menu" to see available products.`,
        quickReplies: QUICK_REPLIES,
      };
    }

    const quantity = Number(rawQuantity);
    return {
      text: `Got it! ${quantity} x ${product.name} = ${
        product.price * quantity
      } BDT. We'll confirm shortly.`,
    };
  }

  if (/\b(hi|hello|hey)\b/.test(normalized)) {
    return {
      text: 'Hi! Type "menu" to see our products, or "order <product name> <quantity>" to order.',
      quickReplies: QUICK_REPLIES,
    };
  }

  if (normalized === "main menu") {
    return {
      text: "How can I help you today? Choose an option below.",
      quickReplies: QUICK_REPLIES,
    };
  }

  if (normalized.includes("delivery") || normalized.includes("shipping")) {
    return {
      text: "Delivery times depend on your location. Send us your area and we'll help you estimate the arrival date.",
      quickReplies: ["Track order", "Main menu"],
    };
  }

  if (normalized.includes("payment") || normalized.includes("pay")) {
    return {
      text: "We accept cash on delivery and common mobile payment methods. Ask us if you need help choosing one.",
      quickReplies: ["Delivery", "Contact", "Main menu"],
    };
  }

  if (normalized.includes("contact") || normalized.includes("support")) {
    return {
      text: "You can reply here and our team will be happy to help during business hours.",
      quickReplies: ["Payment", "Delivery", "Main menu"],
    };
  }

  if (normalized.includes("track") || normalized.includes("status")) {
    return {
      text: "Send your order number and our team can help check its status.",
      quickReplies: ["Delivery", "Returns", "Main menu"],
    };
  }

  if (normalized.includes("return") || normalized.includes("refund")) {
    return {
      text: "Need to make a return? Contact our team with your order number and we'll guide you through the next steps.",
      quickReplies: ["Track order", "Contact", "Main menu"],
    };
  }

  return {
    text: 'Sorry, I didn’t understand that. Choose an option below, or type "menu" to see our products.',
    quickReplies: QUICK_REPLIES,
  };
}

export default function DemoPage() {
  const [channel, setChannel] = useState<Channel>("messenger");
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [draft, setDraft] = useState("");
  const [nextId, setNextId] = useState(4);
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function sendMessage(value: string) {
    const text = value.trim();
    if (!text) return;

    const reply = getReply(text);
    setMessages((current) => [
      ...current,
      { id: nextId, sender: "customer", text },
      { id: nextId + 1, sender: "assistant", ...reply },
    ]);
    setNextId((current) => current + 2);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  function resetChat() {
    setMessages(getInitialMessages());
    setNextId(4);
    setDraft("");
  }

  const isInstagram = channel === "instagram";

  return (
    <main className="min-h-screen bg-[#f3f4f1]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-ink"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>
          <Link href="/login" className="text-sm font-medium text-teal-dark hover:underline">
            Admin login
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <section className="pt-2 lg:pt-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white px-3 py-1.5 text-xs font-medium text-teal-dark">
            <span className="size-1.5 rounded-full bg-success" />
            Interactive product preview
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Try a conversation.
            <span className="mt-1 block text-teal">See how it flows.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate">
            Explore a sample shopping chat. Browse products, ask about delivery,
            or place a pretend order—no account or social media connection needed.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  Preview a channel
                </h2>
                <p className="mt-1 text-xs text-slate">
                  The sample chat looks at home on both.
                </p>
              </div>
              <RotateCcw size={17} className="text-slate" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-paper p-1">
              <button
                type="button"
                onClick={() => setChannel("messenger")}
                aria-pressed={!isInstagram}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  !isInstagram
                    ? "bg-white text-ink shadow-sm"
                    : "text-slate hover:text-ink"
                }`}
              >
                <MessageCircle size={17} />
                Messenger
              </button>
              <button
                type="button"
                onClick={() => setChannel("instagram")}
                aria-pressed={isInstagram}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isInstagram
                    ? "bg-white text-ink shadow-sm"
                    : "text-slate hover:text-ink"
                }`}
              >
                <InstagramIcon size={17} />
                Instagram
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#e8d8b9] bg-[#fffaf0] p-4">
            <p className="text-sm font-semibold text-ink">Demo data only</p>
            <p className="mt-1 text-xs leading-5 text-slate">
              This is a local simulation with sample products and illustrative
              answers. It does not send messages, create real orders, or use
              configured Meta accounts.
            </p>
          </div>
        </section>

        <section
          aria-label="Interactive chatbot demo"
          className="mx-auto w-full max-w-140 overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_24px_80px_-28px_rgba(20,33,61,0.28)]"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-11 items-center justify-center rounded-full ${
                  isInstagram ? "bg-[#f8e8ec] text-[#a64c72]" : "bg-[#e7effa] text-[#3567ae]"
                }`}
              >
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">Willow &amp; Thread</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate">
                  <span className="size-1.5 rounded-full bg-success" />
                  Demo assistant
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isInstagram
                  ? "bg-[#f8e8ec] text-[#944464]"
                  : "bg-[#e7effa] text-[#3567ae]"
              }`}
            >
              {isInstagram ? <InstagramIcon size={13} /> : <MessageCircle size={13} />}
              {isInstagram ? "Instagram" : "Messenger"}
            </span>
          </div>

          <div
            aria-live="polite"
            className="flex h-[min(62vh,570px)] min-h-92.5 flex-col gap-4 overflow-y-auto bg-[#f7f8f6] px-4 py-5 sm:px-6"
          >
            <div className="mx-auto rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate">
              Sample conversation
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender === "customer" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.sender === "customer"
                      ? "rounded-br-md bg-teal text-white"
                      : "rounded-bl-md border border-border/70 bg-white text-ink shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
                {message.quickReplies && (
                  <div className="mt-2 flex max-w-[95%] flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={`${message.id}-${reply}`}
                        type="button"
                        onClick={() => sendMessage(reply)}
                        className="rounded-full border border-teal/25 bg-white px-3 py-1.5 text-xs font-medium text-teal-dark transition-colors hover:border-teal hover:bg-[#edf5f1] focus:outline-none focus:ring-2 focus:ring-teal/30"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endOfMessages} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-white p-4">
            <label htmlFor="demo-message" className="sr-only">
              Type a message to the sample assistant
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-1.5 pl-4 shadow-sm focus-within:border-teal/60 focus-within:ring-2 focus-within:ring-teal/10">
              <input
                id="demo-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Try “menu” or “order canvas tote 2”…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate/80"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[11px] leading-4 text-slate">
                Sample assistant · No messages are sent
              </p>
              <button
                type="button"
                onClick={resetChat}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-dark hover:underline"
              >
                <RotateCcw size={13} />
                Reset chat
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 pb-8 text-center text-xs text-slate sm:px-8">
        <span>Want to manage your own products and orders?</span>
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-teal-dark hover:underline">
          Go to admin login <ArrowRight size={13} />
        </Link>
      </div>
    </main>
  );
}
