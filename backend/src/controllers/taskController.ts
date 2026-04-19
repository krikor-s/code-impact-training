import { Request, Response } from "express";
import { getTasks } from "../services/taskService";

export function getTasksController(req: Request, res: Response) {
  const data = getTasks();
  res.json({ success: true, data });
}
