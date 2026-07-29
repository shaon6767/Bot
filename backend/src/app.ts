import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import webhookRoutes from "./webhooks/webhook.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Webhook route registered BEFORE express.json() — it needs the raw body itself
app.use("/webhook", webhookRoutes);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use(errorHandler);

export default app;
