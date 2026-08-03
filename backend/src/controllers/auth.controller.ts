import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Business } from "../models/Business.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

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

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { email } = req.body;

  const business = await Business.findOne({ email });

  // Always respond the same way whether or not the email exists —
  // otherwise this endpoint becomes a way to check who's registered.
  const genericResponse = {
    message: "If an account exists for that email, a reset link has been sent.",
  };

  if (!business) {
    res.json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  business.resetTokenHash = tokenHash;
  business.resetTokenExpiry = expiry;
  await business.save();

  const resetLink = `${env.clientUrl}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(business.email, resetLink);

  res.json(genericResponse);
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { token, password } = req.body;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const business = await Business.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiry: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpiry");

  if (!business) {
    res.status(400).json({ message: "Invalid or expired reset link" });
    return;
  }

  business.passwordHash = await bcrypt.hash(password, 10);
  business.resetTokenHash = undefined;
  business.resetTokenExpiry = undefined;
  await business.save();

  res.json({ message: "Password updated. You can now log in." });
}
