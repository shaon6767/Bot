import { Router } from "express";
import { getOrders, updateOrderStatus } from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateOrderStatusSchema } from "../schemas/order.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", getOrders);
router.patch("/:id", validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
