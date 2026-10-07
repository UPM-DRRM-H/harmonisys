import { prisma } from '@/lib/prisma';
export async function getUserById(id: string) { return prisma.user.findUnique({ where: { id } }); }
export async function getAccountById(userId: string) { return prisma.account.findFirst({ where: { userId } }); }
