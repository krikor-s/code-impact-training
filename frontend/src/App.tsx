import { useState } from "react";
import type { Task } from "./types";

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4 w-full max-w-md">
      <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
      <p className="text-sm text-gray-500 mt-1">
        {task.completed ? "Done" : "Not completed"}
      </p>
    </div>
  );
}

export default function App() {
  const [tasks] = useState<Task[]>([
    { id: "1", title: "Set up the project", completed: true },
    { id: "2", title: "Build the TaskCard component", completed: true },
    { id: "3", title: "Connect to the backend", completed: false },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Impact Training</h1>
      <div className="w-full max-w-md">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
