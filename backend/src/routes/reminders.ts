import { Router } from "express";
import {
  getRemindersController,
  getReminderController,
  createReminderController,
  updateReminderController,
  deleteReminderController,
  completeReminderController,
} from "../controllers/reminderController";

const router = Router();

router.get("/", getRemindersController);
router.get("/:id", getReminderController);
router.post("/", createReminderController);
router.patch("/:id", updateReminderController);
router.delete("/:id", deleteReminderController);
router.patch("/:id/complete", completeReminderController);

export default router;
