import { Prisma } from '@prisma/client';

export const UserType: Prisma.UserSelect = {
  id: true,
  telegramId: true,
  userName: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
  groupId: true,
};

export type UserSelect = Prisma.UserGetPayload<{
  select: typeof UserType;
}>;
