import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEventFindMany = vi.hoisted(() => vi.fn());
const mockTaskFindMany = vi.hoisted(() => vi.fn());
const mockReminderFindMany = vi.hoisted(() => vi.fn());
const mockGetWeather = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    event: { findMany: mockEventFindMany },
    task: { findMany: mockTaskFindMany },
    reminder: { findMany: mockReminderFindMany },
  },
}));

vi.mock("../src/services/weatherService", () => ({
  getWeather: mockGetWeather,
}));

import { getDashboardSummary } from "../src/services/dashboardService";

const userId = "user-1";

describe("getDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWeather.mockResolvedValue(null);
  });

  it("returns events, tasks, reminders, and weather as null when no coordinates are provided", async () => {
    const fakeEvents = [{ id: "evt-1", title: "Standup" }];
    const fakeTasks = [{ id: "task-1", title: "Fix bug" }];
    const fakeReminders = [{ id: "rem-1", title: "Call dentist" }];

    mockEventFindMany.mockResolvedValue(fakeEvents);
    mockTaskFindMany.mockResolvedValue(fakeTasks);
    mockReminderFindMany.mockResolvedValue(fakeReminders);

    const result = await getDashboardSummary(userId);

    expect(result).toEqual({
      events: fakeEvents,
      tasks: fakeTasks,
      reminders: fakeReminders,
      weather: null,
    });
    expect(mockGetWeather).not.toHaveBeenCalled();
  });

  it("fetches weather using the provided lat/lon coordinates", async () => {
    const fakeWeather = { temperature: 72, condition: "clear sky" };
    mockEventFindMany.mockResolvedValue([]);
    mockTaskFindMany.mockResolvedValue([]);
    mockReminderFindMany.mockResolvedValue([]);
    mockGetWeather.mockResolvedValue(fakeWeather);

    const result = await getDashboardSummary(userId, 40.7128, -74.006);

    expect(result.weather).toEqual(fakeWeather);
    expect(mockGetWeather).toHaveBeenCalledWith(40.7128, -74.006);
  });

  it("queries events within today's UTC boundaries ordered by startAt", async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockTaskFindMany.mockResolvedValue([]);
    mockReminderFindMany.mockResolvedValue([]);

    await getDashboardSummary(userId);

    const eventCall = mockEventFindMany.mock.calls[0][0];
    expect(eventCall.where.userId).toBe(userId);
    expect(eventCall.where.startAt.gte).toBeInstanceOf(Date);
    expect(eventCall.where.startAt.lte).toBeInstanceOf(Date);
    expect(eventCall.orderBy).toEqual({ startAt: "asc" });

    const gte = eventCall.where.startAt.gte as Date;
    const lte = eventCall.where.startAt.lte as Date;
    expect(gte.getHours()).toBe(0);
    expect(gte.getMinutes()).toBe(0);
    expect(lte.getHours()).toBe(23);
    expect(lte.getMinutes()).toBe(59);
  });

  it("queries tasks with UPCOMING status and dueDate up to end of today", async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockTaskFindMany.mockResolvedValue([]);
    mockReminderFindMany.mockResolvedValue([]);

    await getDashboardSummary(userId);

    const taskCall = mockTaskFindMany.mock.calls[0][0];
    expect(taskCall.where.userId).toBe(userId);
    expect(taskCall.where.status).toBe("UPCOMING");
    expect(taskCall.where.dueDate.lte).toBeInstanceOf(Date);
  });

  it("queries reminders with UPCOMING status within today's boundaries", async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockTaskFindMany.mockResolvedValue([]);
    mockReminderFindMany.mockResolvedValue([]);

    await getDashboardSummary(userId);

    const reminderCall = mockReminderFindMany.mock.calls[0][0];
    expect(reminderCall.where.userId).toBe(userId);
    expect(reminderCall.where.status).toBe("UPCOMING");
    expect(reminderCall.where.scheduledAt.gte).toBeInstanceOf(Date);
    expect(reminderCall.where.scheduledAt.lte).toBeInstanceOf(Date);
  });

  it("returns empty arrays when no data exists for today", async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockTaskFindMany.mockResolvedValue([]);
    mockReminderFindMany.mockResolvedValue([]);

    const result = await getDashboardSummary(userId);
    expect(result).toEqual({ events: [], tasks: [], reminders: [], weather: null });
  });
});
