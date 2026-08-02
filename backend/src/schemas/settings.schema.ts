import { z } from "zod";

export const updateSettingsSchema = z.object({
  pageId: z.string().trim().min(1).optional(),
  pageAccessToken: z.string().trim().min(1).optional(),
  instagramAccountId: z.string().trim().min(1).optional(),
});
