import { useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { data?: { token: string }; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("token", data.data!.token);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Log in</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-700"
        >
          Log in
        </button>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-gray-900 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
