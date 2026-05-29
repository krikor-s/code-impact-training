import { Status } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function getTasks(userId: string) {
  return prisma.task.findMany({ where: { userId } });
}

export async function getTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new Error("NOT_FOUND");
  return task;
}

export async function createTask(userId: string, title: string, dueDate?: Date) {
  return prisma.task.create({ data: { title, userId, dueDate } });
}

export async function updateTask(
  id: string,
  userId: string,
  fields: { title?: string; status?: Status; dueDate?: Date | null }
) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new Error("NOT_FOUND");
  return prisma.task.update({ where: { id }, data: fields });
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new Error("NOT_FOUND");
  await prisma.task.delete({ where: { id } });
}

export async function completeTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new Error("NOT_FOUND");
  return prisma.task.update({ where: { id }, data: { status: Status.COMPLETED } });
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}
