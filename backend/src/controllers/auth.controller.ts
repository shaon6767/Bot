import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Business } from "../models/Business";

function setAuthCookie(res: Response, businessId: string): void {
  const token = jwt.sign({ businessId }, env.jwtSecret, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  const existing = await Business.findOne({ email: email.toLowerCase() });
  if (existing) {
    res
      .status(400)
      .json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const business = await Business.create({ name, email, passwordHash });

  setAuthCookie(res, business._id.toString());
  res
    .status(201)
    .json({ id: business._id, name: business.name, email: business.email });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const business = await Business.findOne({
    email: email.toLowerCase(),
  }).select("+passwordHash");
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
