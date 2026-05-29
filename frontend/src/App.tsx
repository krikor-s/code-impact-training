import { useEffect } from "react";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import TasksPage from "./pages/TasksPage";
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

  return (
    <Layout>
      <h1 className="text-5xl font-bold text-gray-900 text-center mt-12 mb-16">
        Code Impact Training
      </h1>
      <div className="flex flex-col items-center gap-4">
        <a
          href="/tasks"
          className="inline-block bg-gray-900 text-white text-base font-medium px-10 py-3 rounded hover:bg-gray-700 transition-colors duration-150"
        >
          Go to Tasks
        </a>
      </div>
    </Layout>
  );
}
