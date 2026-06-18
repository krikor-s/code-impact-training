import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";

const profileSelect = {
  id: true,
  email: true,
  displayName: true,
  profilePicture: true,
  dailyGoal: true,
  currentStreak: true,
  longestStreak: true,
  createdAt: true,
  updatedAt: true,
};

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
  if (!user) throw new Error("NOT_FOUND");
  return user;
}

export async function updateProfile(
  userId: string,
  fields: { displayName?: string; profilePicture?: string; dailyGoal?: number; email?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");
  return prisma.user.update({
    where: { id: userId },
    data: fields,
    select: profileSelect,
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error("INVALID_PASSWORD");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
