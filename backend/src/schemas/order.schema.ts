import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["new", "confirmed", "shipped", "cancelled"]),
});
