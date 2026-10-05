import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { InstagramIcon } from "@/components/InstagramIcon";

const highlights = [
  {
    icon: MessageCircle,
    title: "Conversations, on autopilot",
    description:
      "Answer common questions and guide shoppers through a conversation that feels natural.",
  },
  {
    icon: ShoppingBag,
    title: "Products to orders",
    description:
      "Let customers browse your catalog and place an order without leaving their messages.",
  },
  {
    icon: PackageCheck,
    title: "One simple workspace",
    description:
      "Keep your products, incoming orders, and chatbot settings together in one dashboard.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-paper">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Chat Commerce home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
            <MessageCircle size={19} strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Chat Commerce
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-white sm:inline-flex"
          >
            Admin login
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
          >
            Try the demo <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-12 sm:px-10 sm:pt-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3.5 py-1.5 text-xs font-medium text-teal-dark shadow-sm">
            <Zap size={14} />
            Chat-first commerce for small businesses
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
            Turn messages into{" "}
            <span className="text-teal">happy customers.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate sm:text-lg sm:leading-8">
            Help shoppers discover products, get quick answers, and place
            orders through the messaging channels they already use.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-dark"
            >
              Explore the interactive demo <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-teal/40 hover:text-teal-dark"
            >
              Admin login
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate">
            The demo is simulated and does not connect to Messenger or Instagram.
          </p>
          <div className="mt-10 flex items-center gap-5 text-sm text-slate">
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={17} className="text-teal" />
              Messenger
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="inline-flex items-center gap-2">
              <InstagramIcon size={17} className="text-teal" />
              Instagram
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-125">
          <div className="absolute -right-12 -top-12 size-56 rounded-full bg-[#dcece4] blur-3xl" />
          <div className="absolute -bottom-12 -left-12 size-52 rounded-full bg-[#f1e7d8] blur-3xl" />
          <div className="relative rounded-4xl border border-white/80 bg-white/70 p-4 shadow-[0_24px_90px_-30px_rgba(20,33,61,0.28)] backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate">
                  Your chat storefront
                </p>
                <p className="mt-1 font-display text-base font-semibold text-ink">
                  A better way to shop
                </p>
              </div>
              <div className="flex -space-x-2">
                <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#e6f2f0] text-teal-dark">
                  <MessageCircle size={16} />
                </span>
                <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#f8e8e8] text-[#a64c72]">
                  <InstagramIcon size={16} />
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-[#f8f8f5]">
              <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3.5">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#e8f0e8] text-teal-dark">
                  <ShoppingBag size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Willow &amp; Thread</p>
                  <p className="text-xs text-slate">Usually replies instantly</p>
                </div>
                <span className="ml-auto size-2 rounded-full bg-success" />
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm">
                  Hey! Welcome to Willow &amp; Thread. What can I help you find?
                </div>
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-teal px-4 py-3 text-sm leading-6 text-white">
                  Show me your products
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-ink shadow-sm">
                  Here are a few favorites:
                  <div className="mt-2 space-y-1 text-[13px] text-slate">
                    <p>Canvas tote — 650 BDT</p>
                    <p>Ceramic mug — 450 BDT</p>
                    <p>Linen notebook — 320 BDT</p>
                  </div>
                  <p className="mt-2 text-[13px] text-teal-dark">
                    To order: <span className="font-medium">order canvas tote 2</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Delivery", "Payment", "Contact"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-teal/20 bg-white px-3 py-1.5 text-xs font-medium text-teal-dark"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-border bg-white p-3">
                <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-xs text-slate">
                  <span>Type a message…</span>
                  <span className="flex size-7 items-center justify-center rounded-lg bg-teal text-white">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/80 bg-white/90 px-4 py-3">
              <p className="text-xs text-slate">Products managed</p>
              <p className="font-data text-sm font-medium text-ink">In one dashboard</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/80 bg-white/65">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-dark">
              Made for the way people shop
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Less back-and-forth. More business.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${
                    index === 1
                      ? "bg-[#f8eee3] text-[#9b6334]"
                      : "bg-[#e9f1ed] text-teal-dark"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
        <p>Chat Commerce — conversations that keep your business moving.</p>
        <div className="flex items-center gap-5">
          <Link href="/demo" className="font-medium text-teal-dark hover:underline">
            Try the demo
          </Link>
          <Link href="/login" className="font-medium text-teal-dark hover:underline">
            Admin login
          </Link>
        </div>
      </footer>
    </main>
  );
}
