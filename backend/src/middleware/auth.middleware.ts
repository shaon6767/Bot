import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  businessId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { businessId: string };
    req.businessId = payload.businessId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
