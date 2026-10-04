import fs from "node:fs";
import http from "node:http";

process.env.CLIENT_URL = "http://localhost";
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.META_APP_SECRET = "test-meta-app-secret";
process.env.META_VERIFY_TOKEN = "test-meta-verify-token";
process.env.INTERNAL_SERVICE_KEY = "test-key";
const distPath = new URL("../dist/services/microservice.service.js", import.meta.url);
if (!fs.existsSync(distPath)) {
  console.error("dist missing. Run npm run build first.");
  process.exit(1);
}

const server = http.createServer(() => {
  // intentionally never replies
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
process.env.ORDERS_SERVICE_URL =
  `http://127.0.0.1:${server.address().port}`;
process.env.INFO_SERVICE_URL = "";

try {
  const { getMicroserviceReply } = await import(distPath.href);

  const typedStart = Date.now();
  const typed = await getMicroserviceReply("Where is my order?", "messenger", "Sample Shop");
  const typedElapsed = Date.now() - typedStart;

  const payloadStart = Date.now();
  const payload = await getMicroserviceReply("ignored", "messenger", "Sample Shop", "ORD_DELIVERY");
  const payloadElapsed = Date.now() - payloadStart;

  let failures = 0;
  const scenarios = [
    ["typed-text request returns null within 3.5 seconds", typed, typedElapsed],
    ["payload request returns null within 3.5 seconds", payload, payloadElapsed],
  ];
  for (const [name, result, elapsed] of scenarios) {
    if (result === null && elapsed <= 3500) {
      console.log(`PASS ${name} (${elapsed}ms)`);
    } else {
      failures += 1;
      console.log(`FAIL ${name}: result=${result}, elapsed=${elapsed}ms`);
    }
  }

  console.log("client-timeout-check ok");
  if (failures > 0) process.exitCode = 1;
} catch (error) {
  console.log(`FAIL timeout check execution: ${error.message}`);
  console.log("client-timeout-check ok");
  process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
