import { Router } from "express";
import {
  getRemindersController,
  getReminderController,
  createReminderController,
  updateReminderController,
  deleteReminderController,
} from "../controllers/reminderController";

const router = Router();

router.get("/", getRemindersController);
router.get("/:id", getReminderController);
router.post("/", createReminderController);
router.patch("/:id", updateReminderController);
router.delete("/:id", deleteReminderController);

export default router;
