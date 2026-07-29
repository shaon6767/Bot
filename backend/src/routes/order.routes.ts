import { Router } from "express";
import { getOrders, updateOrderStatus } from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { updateOrderStatusSchema } from "../schemas/order.schema";

const router = Router();

router.use(requireAuth);
router.get("/", getOrders);
router.patch("/:id", validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
