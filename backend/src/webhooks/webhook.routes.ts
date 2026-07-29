import express, { Router } from "express";
import { verifyMetaSignature } from "../middleware/verifyMetaSignature";
import { handleWebhookGet, handleWebhookPost } from "./webhook.controller";

const router = Router();

router.get("/", handleWebhookGet);
router.post(
  "/",
  express.raw({ type: "application/json" }),
  verifyMetaSignature,
  handleWebhookPost,
);

export default router;
