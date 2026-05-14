import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { signToken } from "../lib/jwt";

export async function signup(email: string, password: string, displayName: string) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
    select: { id: true, email: true, displayName: true, createdAt: true, updatedAt: true },
  });
  const token = signToken(user.id);
  return { token, user };
}
