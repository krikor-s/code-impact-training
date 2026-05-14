import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
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

export async function login(email: string, password: string) {
  const found = await prisma.user.findUnique({ where: { email } });
  if (!found) throw new Error("INVALID_CREDENTIALS");
  const valid = await verifyPassword(password, found.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");
  const token = signToken(found.id);
  return {
    token,
    user: {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    },
  };
}
