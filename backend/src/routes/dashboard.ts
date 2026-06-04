import { Router } from "express";
import { getDashboardController } from "../controllers/dashboardController";

const router = Router();

router.get("/", getDashboardController);

export default router;
