import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function requireAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        req.businessId = payload.businessId;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired session" });
    }
}
