import { Router } from "express";
import {
    getSettings,
    updateSettings,
} from "../controllers/settings.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../schemas/settings.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", getSettings);
router.patch("/", validate(updateSettingsSchema), updateSettings);

export default router;
