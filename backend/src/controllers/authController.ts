import { Request, Response } from "express";
import { signup, login } from "../services/authService";

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

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  try {
    const data = await login(email, password);
    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    throw err;
  }
}
