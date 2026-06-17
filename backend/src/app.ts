import express from "express";
import cors from "cors";
import path from "path";
import taskRouter from "./routes/tasks";
import reminderRouter from "./routes/reminders";
import eventRouter from "./routes/events";
import authRouter from "./routes/auth";
import dashboardRouter from "./routes/dashboard";
import profileRouter from "./routes/profile";
import { requireAuth } from "./middleware/auth";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/tasks", requireAuth, taskRouter);
app.use("/api/v1/reminders", requireAuth, reminderRouter);
app.use("/api/v1/events", requireAuth, eventRouter);
app.use("/api/v1/dashboard", requireAuth, dashboardRouter);
app.use("/api/v1/profile", requireAuth, profileRouter);
app.use("/api/v1/auth", authRouter);

export default app;
