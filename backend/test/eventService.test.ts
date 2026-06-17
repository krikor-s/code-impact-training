import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../src/services/eventService";

const userId = "user-1";

const fakeEvent = {
  id: "evt-1",
  title: "Team standup",
  userId,
  startAt: new Date("2026-06-20T10:00:00Z"),
  endAt: new Date("2026-06-20T10:30:00Z"),
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getEvents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all events for a user", async () => {
    mockFindMany.mockResolvedValue([fakeEvent]);
    const result = await getEvents(userId);
    expect(result).toEqual([fakeEvent]);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { userId } });
  });
});

describe("getEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the event when found", async () => {
    mockFindFirst.mockResolvedValue(fakeEvent);
    const result = await getEvent("evt-1", userId);
    expect(result).toEqual(fakeEvent);
    expect(mockFindFirst).toHaveBeenCalledWith({ where: { id: "evt-1", userId } });
  });

  it("throws NOT_FOUND when event does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(getEvent("bad-id", userId)).rejects.toThrow("NOT_FOUND");
  });
});

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an event without description", async () => {
    mockCreate.mockResolvedValue(fakeEvent);
    const result = await createEvent(
      userId,
      "Team standup",
      new Date("2026-06-20T10:00:00Z"),
      new Date("2026-06-20T10:30:00Z"),
    );
    expect(result).toEqual(fakeEvent);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Team standup",
        userId,
        startAt: new Date("2026-06-20T10:00:00Z"),
        endAt: new Date("2026-06-20T10:30:00Z"),
        description: undefined,
      },
    });
  });

  it("creates an event with a description", async () => {
    const withDesc = { ...fakeEvent, description: "Daily sync" };
    mockCreate.mockResolvedValue(withDesc);
    const result = await createEvent(
      userId,
      "Team standup",
      new Date("2026-06-20T10:00:00Z"),
      new Date("2026-06-20T10:30:00Z"),
      "Daily sync",
    );
    expect(result).toEqual(withDesc);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Team standup",
        userId,
        startAt: new Date("2026-06-20T10:00:00Z"),
        endAt: new Date("2026-06-20T10:30:00Z"),
        description: "Daily sync",
      },
    });
  });
});

describe("updateEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the event when found", async () => {
    const updated = { ...fakeEvent, title: "Renamed standup" };
    mockFindFirst.mockResolvedValue(fakeEvent);
    mockUpdate.mockResolvedValue(updated);
    const result = await updateEvent("evt-1", userId, { title: "Renamed standup" });
    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "evt-1" }, data: { title: "Renamed standup" } });
  });

  it("throws NOT_FOUND when event does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(updateEvent("bad-id", userId, { title: "x" })).rejects.toThrow("NOT_FOUND");
  });
});

describe("deleteEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the event when found", async () => {
    mockFindFirst.mockResolvedValue(fakeEvent);
    mockDelete.mockResolvedValue(fakeEvent);
    await deleteEvent("evt-1", userId);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "evt-1" } });
  });

  it("throws NOT_FOUND when event does not exist", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(deleteEvent("bad-id", userId)).rejects.toThrow("NOT_FOUND");
  });
});
