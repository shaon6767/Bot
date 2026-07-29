import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  price: z.number().positive("Price must be greater than 0"),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  price: z.number().positive().optional(),
});
