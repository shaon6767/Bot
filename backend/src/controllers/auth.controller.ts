import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Business } from "../models/Business.js";

function setAuthCookie(res: Response, businessId: string): void {
  const token = jwt.sign({ businessId }, env.jwtSecret, { expiresIn: "7d" });
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  const existing = await Business.findOne({ email });
  if (existing) {
    res
      .status(400)
      .json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const business = await Business.create({ name, email, passwordHash });
    setAuthCookie(res, business._id.toString());
    res
      .status(201)
      .json({ id: business._id, name: business.name, email: business.email });
  } catch (err: any) {
    if (err.code === 11000) {
      res
        .status(400)
        .json({ message: "An account with this email already exists" });
      return;
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const business = await Business.findOne({ email }).select("+passwordHash");
  if (!business) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, business.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  setAuthCookie(res, business._id.toString());
  res.json({ id: business._id, name: business.name, email: business.email });
}

export function logout(req: Request, res: Response): void {
  res.clearCookie("token");
  res.status(204).send();
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const business = await Business.findById(req.businessId);
  if (!business) {
    res.status(404).json({ message: "Business not found" });
    return;
  }
  res.json({ id: business._id, name: business.name, email: business.email });
}
