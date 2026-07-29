import { Router } from "express";
import { getOrders, updateOrderStatus } from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getOrders);
router.patch("/:id", updateOrderStatus);

export default router;
