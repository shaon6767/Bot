import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
    createProductSchema,
    updateProductSchema,
} from "../schemas/product.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", getProducts);
router.post("/", validate(createProductSchema), createProduct);
router.patch("/:id", validate(updateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
