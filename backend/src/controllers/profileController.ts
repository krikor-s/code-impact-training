import { Request, Response } from "express";
import { getProfile, updateProfile } from "../services/profileService";

export async function getProfileController(req: Request, res: Response) {
  try {
    const data = await getProfile(req.userId!);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    throw err;
  }
}

export async function updateProfileController(req: Request, res: Response) {
  try {
    const fields: { displayName?: string; profilePicture?: string; dailyGoal?: number } = {};

    if (req.body.displayName !== undefined) {
      fields.displayName = req.body.displayName;
    }

    if (req.body.dailyGoal !== undefined) {
      const goal = parseInt(req.body.dailyGoal, 10);
      if (!isNaN(goal) && goal >= 1 && goal <= 100) {
        fields.dailyGoal = goal;
      }
    }

    if (req.file) {
      fields.profilePicture = `/uploads/${req.file.filename}`;
    }

    const data = await updateProfile(req.userId!, fields);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    throw err;
  }
}
