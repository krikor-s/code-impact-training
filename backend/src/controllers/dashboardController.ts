import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboardService";

export async function getDashboardController(req: Request, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const coords = !isNaN(lat) && !isNaN(lon) ? { lat, lon } : undefined;

  const data = await getDashboardSummary(req.userId!, coords);
  res.json({ success: true, data });
}
