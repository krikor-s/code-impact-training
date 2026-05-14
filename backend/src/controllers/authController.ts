import { Request, Response } from "express";
import { signup } from "../services/authService";

export async function signupController(req: Request, res: Response) {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  try {
    const data = await signup(email, password, displayName);
    return res.status(201).json({ success: true, data });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      return res.status(400).json({ success: false, error: "Email already in use" });
    }
    throw err;
  }
}
