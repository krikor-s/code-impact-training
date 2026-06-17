import { useEffect } from "react";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import TasksPage from "./pages/TasksPage";
import RemindersPage from "./pages/RemindersPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";

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
  if (path === "/profile") return <ProfilePage />;

  return <DashboardPage />;
}
