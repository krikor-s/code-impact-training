import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("hashPassword", () => {
  it("returns a hash different from the input", async () => {
    const hash = await hashPassword("secret");
    expect(hash).not.toBe("secret");
  });
});

describe("verifyPassword", () => {
  it("returns true when the password matches the hash", async () => {
    const hash = await hashPassword("secret");
    expect(await verifyPassword("secret", hash)).toBe(true);
  });

  it("returns false when the password does not match the hash", async () => {
    const hash = await hashPassword("secret");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
