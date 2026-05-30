import { Router } from "express";
import {
  getEventsController,
  getEventController,
  createEventController,
  updateEventController,
  deleteEventController,
} from "../controllers/eventController";

const router = Router();

router.get("/", getEventsController);
router.get("/:id", getEventController);
router.post("/", createEventController);
router.patch("/:id", updateEventController);
router.delete("/:id", deleteEventController);

export default router;
