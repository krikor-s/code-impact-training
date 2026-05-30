import { Request, Response } from "express";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/eventService";

export async function getEventsController(req: Request, res: Response) {
  const data = await getEvents(req.userId!);
  res.json({ success: true, data });
}

export async function getEventController(req: Request, res: Response) {
  try {
    const data = await getEvent(req.params.id, req.userId!);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    throw err;
  }
}

export async function createEventController(req: Request, res: Response) {
  const { title, startAt, endAt, description } = req.body;
  if (!title || !startAt || !endAt) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const data = await createEvent(
    req.userId!,
    title,
    new Date(startAt),
    new Date(endAt),
    description
  );
  res.status(201).json({ success: true, data });
}

export async function updateEventController(req: Request, res: Response) {
  try {
    const { title, description, startAt, endAt } = req.body;
    const fields: { title?: string; description?: string; startAt?: Date; endAt?: Date } = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (startAt !== undefined) fields.startAt = new Date(startAt);
    if (endAt !== undefined) fields.endAt = new Date(endAt);
    const data = await updateEvent(req.params.id, req.userId!, fields);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    throw err;
  }
}

export async function deleteEventController(req: Request, res: Response) {
  try {
    await deleteEvent(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    throw err;
  }
}
