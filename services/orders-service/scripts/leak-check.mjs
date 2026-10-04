import { spawn } from "node:child_process";

const env = {
  ...process.env,
  PORT: "5101",
  INTERNAL_SERVICE_KEY: "test-key",
};

const child = spawn(process.execPath, ["dist/index.js"], { env, stdio: "inherit" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  await wait(1200);
  const before = process.memoryUsage().heapUsed;

  for (let i = 0; i < 5000; i += 1) {
    const response = await fetch(`http://127.0.0.1:${env.PORT}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": env.INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify({
        text: "What are my order status and delivery times?",
        channel: "messenger",
        shopName: "Sample Shop",
      }),
    });
    await response.text();
  }

  if (global.gc) global.gc();
  const after = process.memoryUsage().heapUsed;
  console.log(`orders-service heap before=${before} after=${after}`);
  child.kill("SIGTERM");
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  child.kill("SIGTERM");
  process.exit(1);
});
