import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "./api";

function mockFetch(status: number, body: unknown = {}) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  localStorage.clear();
  delete (window as { location?: unknown }).location;
  (window as { location: unknown }).location = { pathname: "/", href: "/" };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("sets Content-Type to application/json", async () => {
    const fetch = mockFetch(200);
    vi.stubGlobal("fetch", fetch);
    await apiFetch("/api/test");
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("adds Authorization header when token is in localStorage", async () => {
    localStorage.setItem("token", "my-jwt");
    const fetch = mockFetch(200);
    vi.stubGlobal("fetch", fetch);
    await apiFetch("/api/test");
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-jwt");
  });

  it("omits Authorization header when no token in localStorage", async () => {
    const fetch = mockFetch(200);
    vi.stubGlobal("fetch", fetch);
    await apiFetch("/api/test");
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("on 401: clears token and redirects to /login", async () => {
    localStorage.setItem("token", "expired-jwt");
    vi.stubGlobal("fetch", mockFetch(401));
    await apiFetch("/api/test");
    expect(localStorage.getItem("token")).toBeNull();
    expect((window.location as { href: string }).href).toBe("/login");
  });

  it("on 401 already on /login: does not redirect or clear token", async () => {
    (window as { location: unknown }).location = { pathname: "/login", href: "/login" };
    localStorage.setItem("token", "expired-jwt");
    vi.stubGlobal("fetch", mockFetch(401));
    await apiFetch("/api/test");
    expect((window.location as { href: string }).href).toBe("/login");
    expect(localStorage.getItem("token")).toBe("expired-jwt");
  });
});
