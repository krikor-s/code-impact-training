import { useEffect } from "react";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import TasksPage from "./pages/TasksPage";
import RemindersPage from "./pages/RemindersPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./components/Layout";

export default function App() {
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
  if (path === "/tasks") return <TasksPage />;
  if (path === "/reminders") return <RemindersPage />;
  if (path === "/calendar") return <CalendarPage />;
  if (path === "/dashboard") return <DashboardPage />;

  return (
    <Layout>
      <div className="flex flex-col items-center mt-8">
        <div className="border border-gray-300 bg-white rounded-xl px-10 py-5 shadow-sm mb-12">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            Code Impact Training
          </h1>
        </div>
        <div className="flex flex-col items-center gap-3">
          <a
            href="/tasks"
            className="w-52 text-center bg-slate-600 text-white text-sm font-medium px-6 py-3 rounded hover:bg-slate-500 transition-colors duration-150"
          >
            Go to Tasks
          </a>
          <a
            href="/reminders"
            className="w-52 text-center bg-slate-600 text-white text-sm font-medium px-6 py-3 rounded hover:bg-slate-500 transition-colors duration-150"
          >
            Go to Reminders
          </a>
          <a
            href="/calendar"
            className="w-52 text-center bg-slate-600 text-white text-sm font-medium px-6 py-3 rounded hover:bg-slate-500 transition-colors duration-150"
          >
            Go to Calendar
          </a>
          <a
            href="/dashboard"
            className="w-52 text-center bg-slate-600 text-white text-sm font-medium px-6 py-3 rounded hover:bg-slate-500 transition-colors duration-150"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </Layout>
  );
}
