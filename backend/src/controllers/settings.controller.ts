import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Business } from "../models/Business.js";

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
