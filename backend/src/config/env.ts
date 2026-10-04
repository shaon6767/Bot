import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: required("CLIENT_URL"),
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
  metaAppSecret: required("META_APP_SECRET"),
  metaVerifyToken: required("META_VERIFY_TOKEN"),
  ordersServiceUrl: process.env.ORDERS_SERVICE_URL,
  infoServiceUrl: process.env.INFO_SERVICE_URL,
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
};
