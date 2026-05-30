import { prisma } from "../lib/prisma";

export async function getEvents(userId: string) {
  return prisma.event.findMany({ where: { userId } });
}

export async function getEvent(id: string, userId: string) {
  const event = await prisma.event.findFirst({ where: { id, userId } });
  if (!event) throw new Error("NOT_FOUND");
  return event;
}

export async function createEvent(
  userId: string,
  title: string,
  startAt: Date,
  endAt: Date,
  description?: string
) {
  return prisma.event.create({ data: { title, userId, startAt, endAt, description } });
}

export async function updateEvent(
  id: string,
  userId: string,
  fields: { title?: string; description?: string; startAt?: Date; endAt?: Date }
) {
  const event = await prisma.event.findFirst({ where: { id, userId } });
  if (!event) throw new Error("NOT_FOUND");
  return prisma.event.update({ where: { id }, data: fields });
}

export async function deleteEvent(id: string, userId: string) {
  const event = await prisma.event.findFirst({ where: { id, userId } });
  if (!event) throw new Error("NOT_FOUND");
  await prisma.event.delete({ where: { id } });
}
