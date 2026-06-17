import { Request, Response } from "express";
import { generateBriefing } from "../services/briefingService";

export async function getBriefingController(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, error: "AI briefing is not configured" });
  }

  const { lat, lon, localTime, timezone } = req.body as {
    lat?: number;
    lon?: number;
    localTime?: string;
    timezone?: string;
  };
  const coords = typeof lat === "number" && typeof lon === "number" ? { lat, lon } : undefined;

  const briefing = await generateBriefing(req.userId!, coords, { localTime, timezone });
  res.json({ success: true, data: { briefing } });
}
