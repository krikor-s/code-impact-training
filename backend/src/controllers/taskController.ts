import { Request, Response } from "express";
import { Status } from "@prisma/client";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

export async function getTasksController(req: Request, res: Response) {
  const data = await getTasks(req.userId!);
  res.json({ success: true, data });
}

export async function getTaskController(req: Request, res: Response) {
  try {
    const data = await getTask(req.params.id, req.userId!);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    throw err;
  }
}

export async function createTaskController(req: Request, res: Response) {
  const { title, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const data = await createTask(
    req.userId!,
    title,
    dueDate ? new Date(dueDate) : undefined
  );
  res.status(201).json({ success: true, data });
}

export async function updateTaskController(req: Request, res: Response) {
  try {
    const { title, status, dueDate } = req.body;
    const fields: { title?: string; status?: Status; dueDate?: Date | null } = {};
    if (title !== undefined) fields.title = title;
    if (status !== undefined) fields.status = status;
    if (dueDate !== undefined) fields.dueDate = dueDate ? new Date(dueDate) : null;
    const data = await updateTask(req.params.id, req.userId!, fields);
    res.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    throw err;
  }
}

export async function deleteTaskController(req: Request, res: Response) {
  try {
    await deleteTask(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    throw err;
  }
}
