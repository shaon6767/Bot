import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error(err.message, err.stack);

  const status = err.status || 500;
  const message = status === 500 ? "Something went wrong" : err.message;

  res.status(status).json({ message });
}
