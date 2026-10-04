import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const distUrl = new URL("../dist/services/microservice.service.js", import.meta.url);
if (!fs.existsSync(fileURLToPath(distUrl))) {
  console.error("dist missing. Run npm run build first.");
  process.exitCode = 1;
} else {
  const scenarios = [
    ["ORD_DELIVERY routes only to orders with the internal key and payload"],
    ["INFO_PAYMENT routes only to info"],
    ["unknown payload returns null without calling either service"],
    ["typed text queries both services and returns a matched reply"],
    ["service base URLs with and without /reply both work"],
    ["HTTP 500 from both services returns null for typed text and payload"],
    ["invalid JSON response returns null"],
    ["schema-invalid response returns null"],
  ];

  const childSource = `
    import assert from "node:assert/strict";
    import http from "node:http";

    const servers = [];
    const startServer = async (handler) => {
      const server = http.createServer((req, res) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => handler(req, res, Buffer.concat(chunks).toString()));
      });
      servers.push(server);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const { port } = server.address();
      return { server, url: "http://127.0.0.1:" + port };
    };
    const closeServers = async () => {
      await Promise.all(servers.map((server) => new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      })));
    };
    const json = (res, body, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const reply = (text, matched = true) => ({ matched, text });
    const scenario = Number(process.env.CHECK_SCENARIO);

    try {
      const counts = { orders: 0, info: 0 };
      const requests = { orders: [], info: [] };
      const makeReplyServer = (type, createResponse) => startServer((req, res, rawBody) => {
        counts[type] += 1;
        requests[type].push({
          path: req.url,
          key: req.headers["x-internal-key"],
          body: JSON.parse(rawBody || "{}"),
        });
        createResponse(req, res);
      });

      let orders;
      let info;
      let result;
      switch (scenario) {
        case 0: {
          orders = await makeReplyServer("orders", (_req, res) => json(res, reply("orders reply")));
          info = await makeReplyServer("info", (_req, res) => json(res, reply("info reply")));
          process.env.ORDERS_SERVICE_URL = orders.url;
          process.env.INFO_SERVICE_URL = info.url + "/reply";
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "ORD_DELIVERY");
          assert.equal(result?.text, "orders reply");
          assert.deepEqual(counts, { orders: 1, info: 0 });
          assert.equal(requests.orders[0].path, "/reply");
          assert.equal(requests.orders[0].key, "test-key");
          assert.equal(requests.orders[0].body.payload, "ORD_DELIVERY");
          break;
        }
        case 1: {
          orders = await makeReplyServer("orders", (_req, res) => json(res, reply("orders reply")));
          info = await makeReplyServer("info", (_req, res) => json(res, reply("info reply")));
          process.env.ORDERS_SERVICE_URL = orders.url;
          process.env.INFO_SERVICE_URL = info.url;
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "INFO_PAYMENT");
          assert.equal(result?.text, "info reply");
          assert.deepEqual(counts, { orders: 0, info: 1 });
          assert.equal(requests.info[0].body.payload, "INFO_PAYMENT");
          break;
        }
        case 2: {
          orders = await makeReplyServer("orders", (_req, res) => json(res, reply("orders reply")));
          info = await makeReplyServer("info", (_req, res) => json(res, reply("info reply")));
          process.env.ORDERS_SERVICE_URL = orders.url;
          process.env.INFO_SERVICE_URL = info.url;
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "FOO_BAR");
          assert.equal(result, null);
          assert.deepEqual(counts, { orders: 0, info: 0 });
          break;
        }
        case 3: {
          orders = await makeReplyServer("orders", (_req, res) => json(res, reply("no order match", false)));
          info = await makeReplyServer("info", (_req, res) => json(res, reply("matched info reply")));
          process.env.ORDERS_SERVICE_URL = orders.url;
          process.env.INFO_SERVICE_URL = info.url;
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("payment and delivery", "messenger", "Sample Shop");
          assert.equal(result?.text, "matched info reply");
          assert.deepEqual(counts, { orders: 1, info: 1 });
          assert.equal(requests.orders[0].body.text, "payment and delivery");
          assert.equal(requests.info[0].body.text, "payment and delivery");
          break;
        }
        case 4: {
          orders = await makeReplyServer("orders", (_req, res) => json(res, reply("no order match", false)));
          info = await makeReplyServer("info", (_req, res) => json(res, reply("matched info reply")));
          process.env.ORDERS_SERVICE_URL = orders.url;
          process.env.INFO_SERVICE_URL = info.url + "/reply";
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          assert.equal(result?.text, "matched info reply");
          assert.equal(requests.orders[0].path, "/reply");
          assert.equal(requests.info[0].path, "/reply");
          assert.deepEqual(counts, { orders: 1, info: 1 });
          break;
        }
        case 5: {
          const failing = await startServer((_req, res) => {
            counts.orders += 1;
            res.writeHead(500);
            res.end("upstream failure");
          });
          process.env.ORDERS_SERVICE_URL = failing.url;
          process.env.INFO_SERVICE_URL = failing.url;
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          const typedResult = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          const payloadResult = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "ORD_DELIVERY");
          assert.equal(typedResult, null);
          assert.equal(payloadResult, null);
          assert.equal(counts.orders, 3);
          break;
        }
        case 6: {
          const invalidJson = await startServer((_req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("{");
          });
          process.env.ORDERS_SERVICE_URL = invalidJson.url;
          process.env.INFO_SERVICE_URL = "";
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          assert.equal(result, null);
          break;
        }
        case 7: {
          const invalidSchema = await startServer((_req, res) => json(res, { matched: "yes", text: "bad schema" }));
          process.env.ORDERS_SERVICE_URL = invalidSchema.url;
          process.env.INFO_SERVICE_URL = "";
          const { getMicroserviceReply } = await import(${JSON.stringify(distUrl.href)});
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          assert.equal(result, null);
          break;
        }
        default:
          throw new Error("Unknown scenario");
      }
    } finally {
      await closeServers();
    }
  `;

  let failures = 0;
  for (let index = 0; index < scenarios.length; index += 1) {
    const [name] = scenarios[index];
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", childSource], {
      env: {
        CHECK_SCENARIO: String(index),
        CLIENT_URL: "http://127.0.0.1",
        MONGO_URI: "mongodb://127.0.0.1:1/test",
        JWT_SECRET: "test-secret",
        META_APP_SECRET: "test-meta-app-secret",
        META_VERIFY_TOKEN: "test-meta-verify-token",
        INTERNAL_SERVICE_KEY: "test-key",
        ORDERS_SERVICE_URL: "",
        INFO_SERVICE_URL: "",
      },
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });

    if (result.status === 0) {
      console.log(`PASS ${name}`);
    } else {
      failures += 1;
      const reason = result.error?.message || result.stderr?.trim() || `child exited ${result.status}`;
      console.log(`FAIL ${name}: ${reason.replace(/\s+/g, " ").slice(0, 500)}`);
    }
  }

  console.log("payload-routing-check ok");
  if (failures > 0) process.exitCode = 1;
}
