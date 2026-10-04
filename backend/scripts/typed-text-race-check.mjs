import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const distUrl = new URL("../dist/services/microservice.service.js", import.meta.url);
if (!fs.existsSync(fileURLToPath(distUrl))) {
  console.error("dist missing. Run npm run build first.");
  process.exitCode = 1;
} else {
  const scenarios = [
    "fast info match beats slow orders response",
    "no-match info response waits for the slower orders match",
    "two unresponsive services time out in about three seconds",
    "down orders service does not delay an info match",
    "fast match aborts the slower request and the child exits naturally",
    "a single configured service can return a match",
    "no configured services returns null without a network call",
  ];

  const childSource = `
    import assert from "node:assert/strict";
    import http from "node:http";

    const servers = [];
    const startServer = async (handler) => {
      const server = http.createServer((req, res) => {
        req.resume();
        handler(req, res);
      });
      servers.push(server);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      return "http://127.0.0.1:" + server.address().port;
    };
    const unusedPort = async () => {
      const server = http.createServer();
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const port = server.address().port;
      await new Promise((resolve) => server.close(resolve));
      return port;
    };
    const json = (res, body) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const closeServers = async () => {
      await Promise.all(servers.map((server) => new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      })));
    };
    const scenario = Number(process.env.CHECK_SCENARIO);
    const base = "http://127.0.0.1:";
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(" "));
    const setServices = async (ordersUrl, infoUrl) => {
      process.env.ORDERS_SERVICE_URL = ordersUrl;
      process.env.INFO_SERVICE_URL = infoUrl;
      return import(${JSON.stringify(distUrl.href)});
    };

    try {
      let ordersUrl;
      let infoUrl;
      let result;
      let start;
      switch (scenario) {
        case 0:
        case 4: {
          let slowAborted = false;
          let slowTimer;
          ordersUrl = await startServer((_req, res) => {
            res.on("close", () => {
              if (!res.writableFinished) {
                slowAborted = true;
                clearTimeout(slowTimer);
              }
            });
            slowTimer = setTimeout(() => json(res, { matched: true, text: "slow orders reply" }), 2000);
          });
          infoUrl = await startServer((_req, res) => json(res, { matched: true, text: "fast info reply" }));
          const { getMicroserviceReply } = await setServices(ordersUrl, infoUrl);
          start = Date.now();
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          const elapsed = Date.now() - start;
          assert.equal(result?.text, "fast info reply");
          assert.ok(elapsed < 800, "result took " + elapsed + "ms");
          assert.equal(warnings.length, 0, "unexpected warning while cancelling the slower request");
          if (scenario === 4) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            assert.equal(slowAborted, true, "slow service did not observe the aborted connection");
          }
          break;
        }
        case 1: {
          ordersUrl = await startServer((_req, res) => {
            setTimeout(() => json(res, { matched: true, text: "orders reply" }), 700);
          });
          infoUrl = await startServer((_req, res) => json(res, { matched: false }));
          const { getMicroserviceReply } = await setServices(ordersUrl, infoUrl);
          start = Date.now();
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          const elapsed = Date.now() - start;
          assert.equal(result?.text, "orders reply");
          assert.ok(elapsed >= 600 && elapsed < 1500, "unexpected wait: " + elapsed + "ms");
          break;
        }
        case 2: {
          ordersUrl = await startServer(() => {});
          infoUrl = await startServer(() => {});
          const { getMicroserviceReply } = await setServices(ordersUrl, infoUrl);
          start = Date.now();
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          const elapsed = Date.now() - start;
          assert.equal(result, null);
          assert.ok(elapsed >= 2900 && elapsed <= 3500, "timeout took " + elapsed + "ms");
          assert.equal(warnings.filter((warning) => warning.includes("timed out")).length, 2);
          break;
        }
        case 3: {
          const downPort = await unusedPort();
          ordersUrl = base + downPort;
          infoUrl = await startServer((_req, res) => json(res, { matched: true, text: "info reply" }));
          const { getMicroserviceReply } = await setServices(ordersUrl, infoUrl);
          start = Date.now();
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          const elapsed = Date.now() - start;
          assert.equal(result?.text, "info reply");
          assert.ok(elapsed < 800, "result took " + elapsed + "ms");
          break;
        }
        case 5: {
          infoUrl = await startServer((_req, res) => json(res, { matched: true, text: "single info reply" }));
          const { getMicroserviceReply } = await setServices("", infoUrl);
          result = await getMicroserviceReply("typed question", "messenger", "Sample Shop");
          assert.equal(result?.text, "single info reply");
          break;
        }
        case 6: {
          const { getMicroserviceReply } = await setServices("", "");
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
      timeout: 8000,
      maxBuffer: 1024 * 1024,
    });

    if (result.status === 0) {
      console.log(`PASS ${scenarios[index]}`);
    } else {
      failures += 1;
      const reason = result.error?.message || result.stderr?.trim() || `child exited ${result.status}`;
      console.log(`FAIL ${scenarios[index]}: ${reason.replace(/\s+/g, " ").slice(0, 500)}`);
    }
  }

  console.log("typed-text-race-check ok");
  if (failures > 0) process.exitCode = 1;
}
