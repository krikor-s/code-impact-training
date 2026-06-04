import { Router } from "express";
import { getDashboardController } from "../controllers/dashboardController";
import { getBriefingController } from "../controllers/briefingController";

const router = Router();

router.get("/", getDashboardController);
router.post("/briefing", getBriefingController);

export default router;
