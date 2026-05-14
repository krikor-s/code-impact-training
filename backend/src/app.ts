import express from "express";
import taskRouter from "./routes/tasks";
import authRouter from "./routes/auth";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/auth", authRouter);

export default app;
