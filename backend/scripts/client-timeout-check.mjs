import fs from "node:fs";
import http from "node:http";

process.env.CLIENT_URL = "http://localhost";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.META_APP_SECRET = "test-meta-app-secret";
process.env.META_VERIFY_TOKEN = "test-meta-verify-token";
process.env.INTERNAL_SERVICE_KEY = "test-key";
process.env.ORDERS_SERVICE_URL = "http://127.0.0.1:5121";
process.env.INFO_SERVICE_URL = "http://127.0.0.1:5122";

const distPath = new URL("../dist/services/microservice.service.js", import.meta.url);
if (!fs.existsSync(distPath)) {
  console.error("dist missing. Run npm run build first.");
  process.exit(1);
}

const loadModule = async () => {
  const url = `${distPath.href}?t=${Date.now()}`;
  return import(url);
};

const server = http.createServer(() => {
  // intentionally never replies
});

await new Promise((resolve) => server.listen(5121, "127.0.0.1", resolve));

const { getMicroserviceReply } = await loadModule();

const typedStart = Date.now();
const typed = await getMicroserviceReply("Where is my order?", "messenger", "Sample Shop");
const typedElapsed = Date.now() - typedStart;

const payloadStart = Date.now();
const payload = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "ORD_DELIVERY");
const payloadElapsed = Date.now() - payloadStart;

server.close();

if (typed !== null || payload !== null) {
  console.error(`Unexpected result: typed=${typed}, payload=${payload}`);
  process.exit(1);
}

if (typedElapsed > 3500 || payloadElapsed > 3500) {
  console.error(`Timed out too late: typed=${typedElapsed}ms payload=${payloadElapsed}ms`);
  process.exit(1);
}

console.log(`client-timeout-check ok: typed=${typedElapsed}ms payload=${payloadElapsed}ms`);
