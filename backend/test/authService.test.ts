import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  prisma: { user: { create: mockCreate } },
}));

vi.mock("../src/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

vi.mock("../src/lib/jwt", () => ({
  signToken: vi.fn().mockReturnValue("mock-token"),
}));

import { signup } from "../src/services/authService";

const fakeUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
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
