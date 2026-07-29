import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error(err.message, err.stack);

  if (err.name === "ValidationError" || err.name === "CastError") {
    res.status(400).json({ message: "Invalid data provided" });
    return;
  }

  if (err.code === 11000) {
    res
      .status(409)
      .json({ message: "A record with this value already exists" });
    return;
  }

  const status = err.status || 500;
  const message = status === 500 ? "Something went wrong" : err.message;

  res.status(status).json({ message });
}
