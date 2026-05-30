export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "UPCOMING" | "COMPLETED";
  dueDate?: string | null;
};

export type RepeatFrequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type Reminder = {
  id: string;
  title: string;
  scheduledAt: string;
  repeatFrequency: RepeatFrequency;
  status: "UPCOMING" | "COMPLETED";
};
