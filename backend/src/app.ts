import express from "express";
import taskRouter from "./routes/tasks";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/tasks", taskRouter);

export default app;
