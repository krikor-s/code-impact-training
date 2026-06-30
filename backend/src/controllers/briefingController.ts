import { Request, Response } from "express";
import { generateBriefing } from "../services/briefingService";

export async function getBriefingController(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, error: "AI briefing is not configured" });
  }

  const { localTime, timezone, lat, lon } = req.body as {
    localTime?: string;
    timezone?: string;
    lat?: number;
    lon?: number;
  };

  const briefing = await generateBriefing(req.userId!, { localTime, timezone }, lat, lon);
  res.json({ success: true, data: { briefing } });
}
