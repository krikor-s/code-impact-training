import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub as string;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}
