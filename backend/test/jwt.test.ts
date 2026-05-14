import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken } from "../src/lib/jwt";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("signToken", () => {
  it("returns a string different from the userId", () => {
    const token = signToken("user-123");
    expect(token).not.toBe("user-123");
    expect(typeof token).toBe("string");
  });
});

describe("verifyToken", () => {
  it("decoded payload contains the correct sub", () => {
    const token = signToken("user-123");
    const payload = verifyToken(token);
    expect(payload.sub).toBe("user-123");
  });

  it("throws on a tampered token", () => {
    expect(() => verifyToken("invalid.token.here")).toThrow();
  });
});
