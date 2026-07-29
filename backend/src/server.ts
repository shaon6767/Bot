import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./db/connect.js";
import { logger } from "./utils/logger.js";

async function start(): Promise<void> {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
}

start();
