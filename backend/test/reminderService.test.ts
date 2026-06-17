import { describe, it, expect, vi, beforeEach } from "vitest";
import { RepeatFrequency } from "@prisma/client";

const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    reminder: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
} from "../src/services/reminderService";

const userId = "user-1";

const fakeReminder = {
  id: "rem-1",
  title: "Take out trash",
  userId,
  scheduledAt: new Date("2026-06-20T09:00:00Z"),
  repeatFrequency: null,
  status: "UPCOMING",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getReminders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all reminders for a user", async () => {
    mockFindMany.mockResolvedValue([fakeReminder]);
    const result = await getReminders(userId);
    expect(result).toEqual([fakeReminder]);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { userId } });
  });
});

describe("getReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the reminder when found", async () => {
    mockFindFirst.mockResolvedValue(fakeReminder);
    const result = await getReminder("rem-1", userId);
    expect(result).toEqual(fakeReminder);
    expect(mockFindFirst).toHaveBeenCalledWith({ where: { id: "rem-1", userId } });
  });

  it("throws NOT_FOUND when reminder does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(getReminder("bad-id", userId)).rejects.toThrow("NOT_FOUND");
  });
});

describe("createReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a reminder without repeat frequency", async () => {
    mockCreate.mockResolvedValue(fakeReminder);
    const result = await createReminder(userId, "Take out trash", new Date("2026-06-20T09:00:00Z"));
    expect(result).toEqual(fakeReminder);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Take out trash",
        userId,
        scheduledAt: new Date("2026-06-20T09:00:00Z"),
        repeatFrequency: undefined,
      },
    });
  });

  it("creates a reminder with a repeat frequency", async () => {
    const repeating = { ...fakeReminder, repeatFrequency: "DAILY" };
    mockCreate.mockResolvedValue(repeating);
    const result = await createReminder(userId, "Take out trash", new Date("2026-06-20T09:00:00Z"), RepeatFrequency.DAILY);
    expect(result).toEqual(repeating);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Take out trash",
        userId,
        scheduledAt: new Date("2026-06-20T09:00:00Z"),
        repeatFrequency: "DAILY",
      },
    });
  });
});

describe("updateReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the reminder when found", async () => {
    const updated = { ...fakeReminder, title: "Updated title" };
    mockFindFirst.mockResolvedValue(fakeReminder);
    mockUpdate.mockResolvedValue(updated);
    const result = await updateReminder("rem-1", userId, { title: "Updated title" });
    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "rem-1" }, data: { title: "Updated title" } });
  });

  it("throws NOT_FOUND when reminder does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(updateReminder("bad-id", userId, { title: "x" })).rejects.toThrow("NOT_FOUND");
  });
});

describe("deleteReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the reminder when found", async () => {
    mockFindFirst.mockResolvedValue(fakeReminder);
    mockDelete.mockResolvedValue(fakeReminder);
    await deleteReminder("rem-1", userId);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "rem-1" } });
  });

  it("throws NOT_FOUND when reminder does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(deleteReminder("bad-id", userId)).rejects.toThrow("NOT_FOUND");
  });
});

describe("completeReminder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NOT_FOUND when reminder does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(completeReminder("bad-id", userId)).rejects.toThrow("NOT_FOUND");
  });

  it("marks reminder as COMPLETED and does not create a new one when no repeat", async () => {
    mockFindFirst.mockResolvedValue(fakeReminder);
    mockUpdate.mockResolvedValue({ ...fakeReminder, status: "COMPLETED" });
    await completeReminder("rem-1", userId);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "rem-1" }, data: { status: "COMPLETED" } });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a next-day reminder when repeat is DAILY", async () => {
    const daily = { ...fakeReminder, repeatFrequency: "DAILY" };
    mockFindFirst.mockResolvedValue(daily);
    mockUpdate.mockResolvedValue({ ...daily, status: "COMPLETED" });
    mockCreate.mockResolvedValue({});
    await completeReminder("rem-1", userId);

    const expectedNext = new Date("2026-06-20T09:00:00Z");
    expectedNext.setDate(expectedNext.getDate() + 1);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Take out trash",
        userId,
        scheduledAt: expectedNext,
        repeatFrequency: "DAILY",
      },
    });
  });

  it("creates a next-week reminder when repeat is WEEKLY", async () => {
    const weekly = { ...fakeReminder, repeatFrequency: "WEEKLY" };
    mockFindFirst.mockResolvedValue(weekly);
    mockUpdate.mockResolvedValue({ ...weekly, status: "COMPLETED" });
    mockCreate.mockResolvedValue({});
    await completeReminder("rem-1", userId);

    const expectedNext = new Date("2026-06-20T09:00:00Z");
    expectedNext.setDate(expectedNext.getDate() + 7);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Take out trash",
        userId,
        scheduledAt: expectedNext,
        repeatFrequency: "WEEKLY",
      },
    });
  });

  it("creates a next-month reminder when repeat is MONTHLY", async () => {
    const monthly = { ...fakeReminder, repeatFrequency: "MONTHLY" };
    mockFindFirst.mockResolvedValue(monthly);
    mockUpdate.mockResolvedValue({ ...monthly, status: "COMPLETED" });
    mockCreate.mockResolvedValue({});
    await completeReminder("rem-1", userId);

    const expectedNext = new Date("2026-06-20T09:00:00Z");
    expectedNext.setMonth(expectedNext.getMonth() + 1);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Take out trash",
        userId,
        scheduledAt: expectedNext,
        repeatFrequency: "MONTHLY",
      },
    });
  });
});
