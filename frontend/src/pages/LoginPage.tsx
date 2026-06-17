import { useState } from "react";
import { apiFetch } from "../lib/api";
import Button from "../components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    const res = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { data?: { token: string; user: { displayName: string } }; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("token", data.data!.token);
    localStorage.setItem("displayName", data.data!.user.displayName);
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-ocean flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="glass-strong rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-1">Welcome to Orbit</h1>
        <p className="text-sm text-white/50 mb-8">Sign in to your account</p>
        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
        <label className="block mb-4">
          <span className="text-sm font-medium text-white/70">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-medium text-white/70">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
          />
        </label>
        <Button type="submit" className="w-full py-3">
          Log in
        </Button>
        <p className="text-sm text-white/40 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-white/70 font-medium hover:text-white">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
