import { describe, it, expect } from "vitest";
import { isOverdue } from "../src/services/taskService";

describe("isOverdue", () => {
  it("returns true for a past date", () => {
    const pastDate = new Date("2000-01-01");
    expect(isOverdue(pastDate)).toBe(true);
  });

  it("returns false for a future date", () => {
    const futureDate = new Date("2099-01-01");
    expect(isOverdue(futureDate)).toBe(false);
  });
});
