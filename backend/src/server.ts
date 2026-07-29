import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./db/connect";
import { logger } from "./utils/logger";

async function start(): Promise<void> {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
}

start();
