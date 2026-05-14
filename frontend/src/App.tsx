import { useState, useEffect } from "react";
import type { Task } from "./types";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

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

  const path = window.location.pathname;
  const isPublic = path === "/signup" || path === "/login";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isPublic && !token) {
      window.location.href = "/login";
    }
  }, [isPublic, token]);

  if (path === "/signup") return <SignupPage />;
  if (path === "/login") return <LoginPage />;
  if (!token) return null;

  function handleSignOut() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Code Impact Training</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-900 underline"
        >
          Sign out
        </button>
      </div>
      <div className="w-full max-w-md">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
