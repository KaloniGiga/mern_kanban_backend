import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";

const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";



  return res.status(statusCode).json({ success: false, message: message});
};

export default errorMiddleware;
