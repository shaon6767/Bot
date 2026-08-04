import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Business } from "../models/Business.js";
import { setIceBreakers } from "../services/iceBreaker.service.js";
import { logger } from "../utils/logger.js";

export async function getSettings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const business = await Business.findById(req.businessId).select(
    "+pageAccessToken",
  );

  if (!business) {
    res.status(404).json({ message: "Business not found" });
    return;
  }

  res.json({
    pageId: business.pageId ?? null,
    instagramAccountId: business.instagramAccountId ?? null,
    pageAccessTokenSet: Boolean(business.pageAccessToken),
  });
}

export async function updateSettings(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { pageId, pageAccessToken, instagramAccountId } = req.body;

  const update: Record<string, string> = {};
  if (pageId !== undefined) update.pageId = pageId;
  if (pageAccessToken !== undefined) update.pageAccessToken = pageAccessToken;
  if (instagramAccountId !== undefined)
    update.instagramAccountId = instagramAccountId;

  await Business.findByIdAndUpdate(req.businessId, update, {
    runValidators: true,
  });

  // A fresh/updated token means we can (re)configure ice breakers for this Page.
  // Failure here shouldn't fail the whole settings save — just log it.
  if (pageAccessToken !== undefined) {
    const ok = await setIceBreakers(pageAccessToken);
    if (!ok) {
      logger.warn(
        `Ice breaker setup failed for business ${req.businessId} — settings still saved`,
      );
    }
  }

  const business = await Business.findById(req.businessId).select(
    "+pageAccessToken",
  );

  if (!business) {
    res.status(404).json({ message: "Business not found" });
    return;
  }

  res.json({
    pageId: business.pageId ?? null,
    instagramAccountId: business.instagramAccountId ?? null,
    pageAccessTokenSet: Boolean(business.pageAccessToken),
  });
}
