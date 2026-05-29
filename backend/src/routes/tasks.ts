import { Router } from "express";
import {
  getTasksController,
  getTaskController,
  createTaskController,
  updateTaskController,
  deleteTaskController,
  completeTaskController,
} from "../controllers/taskController";

const router = Router();

router.get("/", getTasksController);
router.get("/:id", getTaskController);
router.post("/", createTaskController);
router.patch("/:id", updateTaskController);
router.patch("/:id/complete", completeTaskController);
router.delete("/:id", deleteTaskController);

export default router;
