import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  prisma: { user: { create: mockCreate, findUnique: mockFindUnique } },
}));

vi.mock("../src/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("../src/lib/jwt", () => ({
  signToken: vi.fn().mockReturnValue("mock-token"),
}));

import { signup, login } from "../src/services/authService";

const fakeUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeUserWithHash = {
  ...fakeUser,
  passwordHash: "hashed-password",
};

describe("signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(fakeUser);
  });

  it("returns token and user without passwordHash", async () => {
    const result = await signup("test@example.com", "secret", "Test User");
    expect(result.token).toBe("mock-token");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user.email).toBe("test@example.com");
  });

  it("creates user with hashed password, not plain text", async () => {
    await signup("test@example.com", "secret", "Test User");
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        passwordHash: "hashed-password",
        displayName: "Test User",
      },
      select: { id: true, email: true, displayName: true, createdAt: true, updatedAt: true },
    });
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(fakeUserWithHash);
  });

  it("returns token and user without passwordHash on valid credentials", async () => {
    const result = await login("test@example.com", "secret");
    expect(result.token).toBe("mock-token");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user.email).toBe("test@example.com");
  });

  it("throws INVALID_CREDENTIALS when user is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(login("nobody@example.com", "secret")).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("throws INVALID_CREDENTIALS when password is wrong", async () => {
    const { verifyPassword } = await import("../src/lib/password");
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    await expect(login("test@example.com", "wrong")).rejects.toThrow("INVALID_CREDENTIALS");
  });
});
