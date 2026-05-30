import { Request, Response } from "express";
import { RepeatFrequency, Status } from "@prisma/client";
import {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
} from "../services/reminderService";

export async function getRemindersController(req: Request, res: Response) {
  const data = await getReminders(req.userId!);
  res.json({ success: true, data });
}

export async function getReminderController(req: Request, res: Response) {
  try {
    const data = await getReminder(req.params.id, req.userId!);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }
    throw err;
  }
}

export async function createReminderController(req: Request, res: Response) {
  const { title, scheduledAt, repeatFrequency } = req.body;
  if (!title || !scheduledAt) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const data = await createReminder(
    req.userId!,
    title,
    new Date(scheduledAt),
    repeatFrequency as RepeatFrequency | undefined
  );
  res.status(201).json({ success: true, data });
}

export async function updateReminderController(req: Request, res: Response) {
  try {
    const { title, scheduledAt, repeatFrequency, status } = req.body;
    const fields: {
      title?: string;
      scheduledAt?: Date;
      repeatFrequency?: RepeatFrequency;
      status?: Status;
    } = {};
    if (title !== undefined) fields.title = title;
    if (scheduledAt !== undefined) fields.scheduledAt = new Date(scheduledAt);
    if (repeatFrequency !== undefined) fields.repeatFrequency = repeatFrequency;
    if (status !== undefined) fields.status = status;
    const data = await updateReminder(req.params.id, req.userId!, fields);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }
    throw err;
  }
}

export async function deleteReminderController(req: Request, res: Response) {
  try {
    await deleteReminder(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }
    throw err;
  }
}

export async function completeReminderController(req: Request, res: Response) {
  try {
    await completeReminder(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }
    throw err;
  }
}
