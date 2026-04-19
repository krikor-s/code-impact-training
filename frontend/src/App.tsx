import { useState } from "react";
import type { Task } from "./types";

function TaskCard({ task }: { task: Task }) {
  return (
    <div>
      <h2>{task.title}</h2>
      <p>Status: {task.completed ? "done" : "in progress"}</p>
    </div>
  );
}

export default function App() {
  const [tasks] = useState<Task[]>([
    { id: "1", title: "Learn TypeScript", completed: true },
    { id: "2", title: "Build a React component", completed: false },
    { id: "3", title: "Push to GitHub", completed: false },
  ]);

  return (
    <div>
      <h1>Task List</h1>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
