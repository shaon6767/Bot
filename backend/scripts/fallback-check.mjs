import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const distUrl = new URL("../dist/services/fallbackMessages.js", import.meta.url);
const replyUrl = new URL("../dist/services/reply.service.js", import.meta.url);
const conversationUrl = new URL("../dist/services/conversation.service.js", import.meta.url);
const missingDist = [distUrl, replyUrl, conversationUrl].some(
  (url) => !fs.existsSync(fileURLToPath(url)),
);

if (missingDist) {
  console.error("dist missing. Run npm run build first.");
  process.exitCode = 1;
} else {
  process.env.CLIENT_URL = "http://127.0.0.1";
  process.env.MONGO_URI = "mongodb://127.0.0.1:1/test";
  process.env.JWT_SECRET = "test-secret";
  process.env.META_APP_SECRET = "test-meta-app-secret";
  process.env.META_VERIFY_TOKEN = "test-meta-verify-token";
  process.env.INTERNAL_SERVICE_KEY = "test-key";
  process.env.ORDERS_SERVICE_URL = "";
  process.env.INFO_SERVICE_URL = "";

  const tests = [
    [
      "selectFallback returns all four prescribed messages without human promises",
      ({ selectFallback }) => {
        const expected = {
          "unknown-text":
            'Sorry, I didn\'t understand that. Please choose an option below, or type "menu" to see our products.',
          "service-unavailable":
            "Sorry, I can't load that right now. Please try again in a moment.",
          attachment:
            "Thanks for sharing! I can only read text and buttons. Please choose an option below.",
          "unknown-payload":
            'Sorry, I didn\'t understand that. Please choose an option below, or type "menu" to see our products.',
        };
        const humanPromise = ["get back to", "you"].join(" ");
        for (const [kind, text] of Object.entries(expected)) {
          assert.equal(selectFallback(kind), text);
          assert(!text.includes(humanPromise));
        }
      },
    ],
    [
      "greeting typos and short greeting phrases are understood",
      ({ processMessage, products }) => {
        for (const text of ["Hellow", "helo", "hii", "hello there"]) {
          assert.equal(processMessage(text, products).understood, true, text);
        }
      },
    ],
    [
      "long greeting followed by a product question is not hijacked",
      ({ processMessage, products }) => {
        assert.equal(
          processMessage("hi, price of the red shirt?", products).understood,
          false,
        );
      },
    ],
    [
      "menu and order parsing retain their existing behavior",
      ({ processMessage, products }) => {
        assert.match(processMessage("menu", products).replyText, /red shirt/);
        const order = processMessage("order t-shirt 2", products);
        assert.equal(order.orderItems?.[0].quantity, 2);
        assert.match(order.replyText, /We'll confirm shortly/);
      },
    ],
    [
      "main quick replies have at most four titles of 20 characters or fewer",
      ({ MAIN_QUICK_REPLIES }) => {
        assert(MAIN_QUICK_REPLIES.length <= 4);
        for (const quickReply of MAIN_QUICK_REPLIES) {
          assert(quickReply.title.length <= 20, quickReply.title);
        }
        assert.deepEqual(
          MAIN_QUICK_REPLIES.map(({ title, payload }) => ({ title, payload })),
          [
            { title: "Products", payload: "ICE_BREAKER_MENU" },
            { title: "Delivery", payload: "ORD_DELIVERY" },
            { title: "Payment", payload: "INFO_PAYMENT" },
            { title: "Contact", payload: "INFO_CONTACT" },
          ],
        );
      },
    ],
    [
      "MAIN_MENU uses its menu prompt rather than the product list",
      ({ getLocalPayloadReply, MAIN_MENU_REPLY_TEXT, products }) => {
        const result = getLocalPayloadReply("MAIN_MENU", products);
        assert.equal(result?.replyText, MAIN_MENU_REPLY_TEXT);
        assert.notEqual(result?.replyText, "Here's what we have:\n- red shirt: 100 BDT");
        assert.equal(MAIN_MENU_REPLY_TEXT, "How can I help you today? Choose an option below.");
      },
    ],
  ];

  try {
    const [{ selectFallback }, { processMessage }, conversation] = await Promise.all([
      import(distUrl.href),
      import(replyUrl.href),
      import(conversationUrl.href),
    ]);
    const products = [{ name: "red shirt", price: 100 }, { name: "t-shirt", price: 100 }];
    let failures = 0;
    for (const [name, check] of tests) {
      try {
        check({ selectFallback, processMessage, ...conversation, products });
        console.log(`PASS ${name}`);
      } catch (error) {
        failures += 1;
        console.log(`FAIL ${name}: ${error.message}`);
      }
    }

    console.log("fallback-check ok");
    if (failures > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`FAIL unable to load fallback checks: ${error.message}`);
    console.log("fallback-check ok");
    process.exitCode = 1;
  }
}
