import { Router } from "express";
import { getTasksController } from "../controllers/taskController";

const router = Router();

router.get("/", getTasksController);

export default router;
