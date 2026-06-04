import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboardService";

export async function getDashboardController(req: Request, res: Response) {
  const data = await getDashboardSummary(req.userId!);
  res.json({ success: true, data });
}
