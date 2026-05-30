import { RepeatFrequency, Status } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function getReminders(userId: string) {
  return prisma.reminder.findMany({ where: { userId } });
}

export async function getReminder(id: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw new Error("NOT_FOUND");
  return reminder;
}

export async function createReminder(
  userId: string,
  title: string,
  scheduledAt: Date,
  repeatFrequency?: RepeatFrequency
) {
  return prisma.reminder.create({ data: { title, userId, scheduledAt, repeatFrequency } });
}

export async function updateReminder(
  id: string,
  userId: string,
  fields: {
    title?: string;
    scheduledAt?: Date;
    repeatFrequency?: RepeatFrequency;
    status?: Status;
  }
) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw new Error("NOT_FOUND");
  return prisma.reminder.update({ where: { id }, data: fields });
}

export async function deleteReminder(id: string, userId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw new Error("NOT_FOUND");
  await prisma.reminder.delete({ where: { id } });
}
