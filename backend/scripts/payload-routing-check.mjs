import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const distUrl = new URL("../dist/services/microservice.service.js", import.meta.url);
if (!fs.existsSync(distUrl)) {
  console.error("dist missing. Run npm run build first.");
  process.exit(1);
}

const distPath = fileURLToPath(distUrl);
const distModuleUrl = pathToFileURL(distPath).href;

const loadModule = (ordersUrl, infoUrl) => {
  const moduleUrl = new URL(`${distModuleUrl}?ts=${Date.now()}-${Math.random()}`);
  process.env.ORDERS_SERVICE_URL = ordersUrl;
  process.env.INFO_SERVICE_URL = infoUrl;
  return import(moduleUrl.href);
};

const scenario = `
  const http = await import("node:http");
  process.env.CLIENT_URL = "http://localhost";
  process.env.MONGO_URI = "mongodb://localhost:27017/test";
  process.env.JWT_SECRET = "test-secret";
  process.env.META_APP_SECRET = "test-meta-app-secret";
  process.env.META_VERIFY_TOKEN = "test-meta-verify-token";
  process.env.INTERNAL_SERVICE_KEY = "test-key";

  const loadModule = (ordersUrl, infoUrl) => {
    const moduleUrl = new URL(${JSON.stringify(`${distModuleUrl}?ts=`)} + Date.now() + "-" + Math.random());
    process.env.ORDERS_SERVICE_URL = ordersUrl;
    process.env.INFO_SERVICE_URL = infoUrl;
    return import(moduleUrl.href);
  };

  const { getMicroserviceReply } = await loadModule("http://127.0.0.1:5123", "http://127.0.0.1:5124/reply");

  const orderHits = { count: 0, lastBody: null, lastHeader: null };
  const infoHits = { count: 0, lastBody: null, lastHeader: null };

  const orderServer = http.createServer((req, res) => {
    orderHits.count += 1;
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      orderHits.lastBody = JSON.parse(body || "{}");
      orderHits.lastHeader = req.headers["x-internal-key"];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ matched: true, text: "orders reply", quickReplies: [{ title: "Main menu", payload: "MAIN_MENU" }] }));
    });
  });

  const infoServer = http.createServer((req, res) => {
    infoHits.count += 1;
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      infoHits.lastBody = JSON.parse(body || "{}");
      infoHits.lastHeader = req.headers["x-internal-key"];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ matched: true, text: "info reply", quickReplies: [{ title: "Main menu", payload: "MAIN_MENU" }] }));
    });
  });

  await new Promise((resolve) => orderServer.listen(5123, "127.0.0.1", resolve));
  await new Promise((resolve) => infoServer.listen(5124, "127.0.0.1", resolve));

  const ordResult = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "ORD_DELIVERY");
  if (ordResult?.matched !== true || orderHits.count !== 1 || infoHits.count !== 0) {
    throw new Error("ORD payload check failed: " + JSON.stringify({ ordResult, orderHits, infoHits }));
  }
  if (orderHits.lastHeader !== "test-key" || orderHits.lastBody.payload !== "ORD_DELIVERY") {
    throw new Error("ORD request header/body mismatch: " + JSON.stringify({ orderHits }));
  }

  const infoResult = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "INFO_PAYMENT");
  if (infoResult?.matched !== true || infoHits.count !== 1 || orderHits.count !== 1) {
    throw new Error("INFO payload check failed: " + JSON.stringify({ infoResult, orderHits, infoHits }));
  }

  const unknownResult = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "FOO_BAR");
  if (unknownResult !== null || orderHits.count !== 1 || infoHits.count !== 1) {
    throw new Error("Unknown payload check failed: " + JSON.stringify({ unknownResult, orderHits, infoHits }));
  }

  const typedResult = await getMicroserviceReply("payment and delivery", "messenger", "Sample Shop");
  if (typedResult === null || typedResult.matched !== true) {
    throw new Error("Typed text check failed: " + JSON.stringify({ typedResult }));
  }

  const badServer = http.createServer((req, res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "upstream failure" }));
  });
  await new Promise((resolve) => badServer.listen(5125, "127.0.0.1", resolve));

  const { getMicroserviceReply: getBadReply } = await loadModule("http://127.0.0.1:5125", "http://127.0.0.1:5125");
  const badResult = await getBadReply("some text", "messenger", "Sample Shop");
  if (badResult !== null) {
    throw new Error("500 stub should be null: " + JSON.stringify({ badResult }));
  }

  await new Promise((resolve) => badServer.close(resolve));
  await new Promise((resolve) => orderServer.close(resolve));
  await new Promise((resolve) => infoServer.close(resolve));
  console.log("payload-routing-check ok");
`;

const result = spawnSync(process.execPath, ["--input-type=module", "-e", scenario], {
  env: {
    ...process.env,
    CLIENT_URL: "http://localhost",
    MONGO_URI: "mongodb://localhost:27017/test",
    JWT_SECRET: "test-secret",
    META_APP_SECRET: "test-meta-app-secret",
    META_VERIFY_TOKEN: "test-meta-verify-token",
    INTERNAL_SERVICE_KEY: "test-key",
    ORDERS_SERVICE_URL: "http://127.0.0.1:5123",
    INFO_SERVICE_URL: "http://127.0.0.1:5124/reply",
  },
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
